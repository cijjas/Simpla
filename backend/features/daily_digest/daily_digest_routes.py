"""Routes for daily digest feature."""

from fastapi import APIRouter, HTTPException, status, Depends, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from core.database.base import get_db
from core.utils.logging_config import get_logger
from features.auth.auth_utils import get_current_user, get_current_user_id
from .daily_digest_models import DailyDigestNewspaper
from .daily_digest_schemas import (
    DigestPreferencesRequest,
    DigestPreferencesResponse,
    AvailableOrganismsResponse,
    OrganismInfo,
    DailyDigestResponse,
    GenerateDailyDigestRequest,
    GenerateDailyDigestResponse
)
from .daily_digest_service import DailyDigestService

logger = get_logger(__name__)
router = APIRouter()

# Authentication dependency now centralized in auth_utils

@router.get("/daily-digest/dependencies/", response_model=AvailableOrganismsResponse)
async def get_available_dependencies():
    """Get list of all root organisms (nivel=1) available for digest preferences."""
    logger.info("Fetching available dependencies for digest preferences")

    try:
        digest_service = DailyDigestService()
        organisms_data = digest_service.get_root_organisms()
        
        dependencies = [
            OrganismInfo(
                id=org["id"],
                nombre_oficial=org["nombre_oficial"],
                nivel=org["nivel"]
            )
            for org in organisms_data
        ]

        logger.info(f"Found {len(dependencies)} available dependencies")
        return AvailableOrganismsResponse(organisms=dependencies)

    except Exception as e:
        logger.error(f"Error fetching available dependencies: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching available dependencies"
        )


@router.get("/daily-digest/preferences/")
async def get_user_digest_preferences(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[DigestPreferencesResponse]:
    """Get current user's digest preferences."""
    user_id = get_current_user_id(request)
    logger.info(f"Fetching digest preferences for user {user_id}")
    
    try:
        digest_service = DailyDigestService()
        preferences = digest_service.get_user_preferences(db, user_id)
        
        if not preferences:
            return None
        
        return DigestPreferencesResponse(
            user_id=preferences.user_id,
            dependencia_ids=[str(dep_id) for dep_id in preferences.dependencia_ids]
        )
        
    except Exception as e:
        logger.error(f"Error fetching user preferences: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching user preferences"
        )


@router.post("/daily-digest/preferences/", response_model=DigestPreferencesResponse)
async def update_user_digest_preferences(
    request_data: DigestPreferencesRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update current user's digest preferences."""
    user_id = get_current_user_id(request)
    logger.info(f"Updating digest preferences for user {user_id}")
    
    try:
        # Validate that dependencia_ids exist and are level 1
        digest_service = DailyDigestService()
        available_organisms = digest_service.get_root_organisms()
        available_ids = {org["id"] for org in available_organisms}
        
        invalid_ids = set(request_data.dependencia_ids) - available_ids
        if invalid_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid organism IDs: {list(invalid_ids)}"
            )
        
        preferences = digest_service.update_user_preferences(
            db, user_id, request_data.dependencia_ids
        )
        
        return DigestPreferencesResponse(
            user_id=preferences.user_id,
            dependencia_ids=[str(dep_id) for dep_id in preferences.dependencia_ids]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user preferences: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating user preferences"
        )


@router.get("/daily-digest/", response_model=DailyDigestResponse)
async def get_daily_digest(
    target_date: Optional[date] = Query(None, description="Date for the digest (defaults to today)"),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get daily digest for the current user based on their preferences."""
    if target_date is None:
        target_date = date.today()
    
    logger.info(f"Fetching daily digest for user {user_id} for date {target_date}")
    
    try:
        digest_service = DailyDigestService()
        digest_data = digest_service.get_user_daily_digest(db, user_id, target_date)
        
        return DailyDigestResponse(**digest_data)
        
    except Exception as e:
        logger.error(f"Error fetching daily digest: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching daily digest"
        )


@router.post("/daily-digest/generate/", response_model=GenerateDailyDigestResponse)
async def generate_daily_digest(
    request: GenerateDailyDigestRequest,
    db: Session = Depends(get_db)
):
    """
    Generate daily digest summaries for a specific date.
    
    This endpoint:
    1. Fetches normas published on the target date
    2. Filters and generates summaries for each norma
    3. Associates each norma with its root organism
    4. Stores summaries in the database
    
    Can be called manually or scheduled to run daily.
    """
    target_date = request.target_date or date.today()
    logger.info(f"Triggering daily digest generation for {target_date}")
    
    try:
        digest_service = DailyDigestService()
        
        # Generate the daily digest summaries
        result = await digest_service.generate_daily_summaries(
            db=db,
            target_date=target_date
        )
        
        return GenerateDailyDigestResponse(**result)
        
    except Exception as e:
        logger.error(f"Error generating daily digest: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating daily digest: {str(e)}"
        )


@router.get("/daily-digest/newspaper/")
async def get_newspaper_digest(
    target_date: Optional[date] = Query(None, description="Date for the digest (defaults to today)"),
    db: Session = Depends(get_db)
):
    """
    Get the newspaper-style daily digest for a specific date.
    
    Returns all sections of the digest:
    - Hero section (most important norma)
    - Secondary section (next important normas)  
    - Thematic sections (normas grouped by editorial theme)
    
    Also includes norma metadata to avoid additional API calls.
    """
    actual_date = target_date or date.today()
    logger.info(f"Fetching newspaper digest for {actual_date}")
    
    try:
        # Query all sections for the date, ordered by section_order
        sections = db.query(DailyDigestNewspaper).filter(
            DailyDigestNewspaper.digest_date == actual_date
        ).order_by(DailyDigestNewspaper.section_order).all()
        
        if not sections:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No newspaper digest found for {actual_date}"
            )
        
        # Collect all unique norma IDs from all sections
        all_norma_ids = set()
        for section in sections:
            if section.norma_ids:
                all_norma_ids.update(section.norma_ids)
        
        # Get norma metadata for all referenced normas
        norma_metadata = {}
        if all_norma_ids:
            from shared.utils.norma_reconstruction import NormaReconstructor
            reconstructor = NormaReconstructor()
            
            try:
                # Join with normas_referencias table to get the proper numero
                with reconstructor.get_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute("""
                            SELECT ns.infoleg_id, ns.tipo_norma, nr.numero
                            FROM normas_structured ns
                            LEFT JOIN normas_referencias nr ON ns.id = nr.norma_id
                            WHERE ns.infoleg_id = ANY(%s)
                        """, (list(all_norma_ids),))
                        
                        for row in cur.fetchall():
                            infoleg_id, tipo_norma, numero = row
                            norma_metadata[infoleg_id] = {
                                "tipo_norma": tipo_norma or "Norma",
                                "numero": numero
                            }
                            
            except Exception as e:
                logger.warning(f"Error fetching norma metadata: {str(e)}")
                # Continue without metadata if there's an error
        
        # Format response
        digest_sections = []
        for section in sections:
            digest_sections.append({
                "section_type": section.section_type,
                "content": section.section_content,
                "norma_ids": section.norma_ids,
                "order": section.section_order
            })
        
        return {
            "date": str(actual_date),
            "sections": digest_sections,
            "total_sections": len(digest_sections),
            "norma_metadata": norma_metadata
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching newspaper digest: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching newspaper digest"
        )


@router.post("/daily-digest/generate-newspaper/")
async def generate_newspaper_digest(
    target_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """
    Generate newspaper-style daily digest for a specific date.
    
    This endpoint creates a structured digest with:
    1. Hero section (most important norma)
    2. Secondary section (next 2-3 important normas)
    3. Thematic sections (remaining normas grouped by editorial theme)
    
    The process includes:
    - Filtering normas (removing procedural ones)
    - LLM analysis with impact scores and themes
    - Priority ranking by norma type and impact
    - Section generation with tailored content
    """
    actual_date = target_date or date.today()
    logger.info(f"Triggering newspaper digest generation for {actual_date}")
    
    try:
        digest_service = DailyDigestService()
        
        # Generate the newspaper-style digest
        result = await digest_service.generate_daily_newspaper_digest(
            db=db,
            target_date=actual_date
        )
        
        return {
            "success": result["success"],
            "message": result["message"],
            "date": str(result["date"]),
            "normas_analyzed": result.get("normas_analyzed", 0),
            "sections_generated": result.get("sections_generated", 0)
        }
        
    except Exception as e:
        logger.error(f"Error generating newspaper digest: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating newspaper digest: {str(e)}"
        )