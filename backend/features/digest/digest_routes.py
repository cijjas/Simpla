"""Routes for weekly digest feature."""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from core.database.base import get_db
from core.utils.logging_config import get_logger
from features.auth.auth_utils import get_current_user
from features.auth.auth_models import User
from .digest_schemas import (
    UserPreferencesRequest,
    UserPreferencesResponse,
    WeeklyDigestResponse,
    TriggerDigestRequest,
    TriggerDigestResponse
)
from .digest_models import DigestUserPreferences, DigestWeekly
from .digest_service import DigestService
from .digest_email_service import send_digest_to_users

logger = get_logger(__name__)
router = APIRouter()


@router.post("/digest/trigger/", response_model=TriggerDigestResponse)
async def trigger_weekly_digest(
    request: TriggerDigestRequest,
    db: Session = Depends(get_db)
):
    """
    Trigger the weekly digest generation process.
    
    This endpoint:
    1. Fetches normas from the current/specified week
    2. Filters and generates summaries
    3. Creates a generic weekly digest
    4. Sends personalized digests to all users via email
    
    Can be called manually or scheduled to run every Friday.
    """
    logger.info("Triggering weekly digest generation")
    
    try:
        # Initialize service
        digest_service = DigestService()
        
        # Generate the weekly digest
        digest = await digest_service.generate_weekly_digest(
            db=db,
            custom_start=request.week_start,
            custom_end=request.week_end
        )
        
        # Get users with their preferences
        users_with_preferences = digest_service.get_users_with_preferences(db)
        logger.info(f"Found {len(users_with_preferences)} users to send digests to")
        
        # Send personalized emails to users
        emails_sent = 0
        if users_with_preferences and digest.article_json:
            normas_summaries = digest.article_json.get('normas', [])
            emails_sent = send_digest_to_users(
                users_with_preferences=users_with_preferences,
                week_start=digest.week_start,
                week_end=digest.week_end,
                normas_with_summaries=normas_summaries,
                digest_service=digest_service
            )
        
        return TriggerDigestResponse(
            success=True,
            message=f"Weekly digest generated successfully with {digest.total_normas} normas",
            digest_id=digest.id,
            emails_sent=emails_sent
        )
        
    except Exception as e:
        logger.error(f"Error triggering weekly digest: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating weekly digest: {str(e)}"
        )


@router.post("/digest/trigger/test/")
async def trigger_digest_test(
    week_start: date = Query(..., description="Start date (YYYY-MM-DD)"),
    week_end: date = Query(..., description="End date (YYYY-MM-DD)"),
    send_emails: bool = Query(False, description="Whether to send emails to users"),
    db: Session = Depends(get_db)
):
    """
    Testing endpoint to trigger digest generation with specific dates.
    
    By default, this endpoint only generates the digest without sending emails.
    Set send_emails=true to also send emails to users based on their preferences.
    
    Examples:
    - Without emails: POST /digest/trigger/test/?week_start=2025-10-13&week_end=2025-10-17
    - With emails: POST /digest/trigger/test/?week_start=2025-10-13&week_end=2025-10-17&send_emails=true
    """
    logger.info(f"Testing digest generation for {week_start} to {week_end} (send_emails={send_emails})")
    
    try:
        # Initialize service
        digest_service = DigestService()
        
        # Generate the weekly digest
        digest = await digest_service.generate_weekly_digest(
            db=db,
            custom_start=week_start,
            custom_end=week_end
        )
        
        emails_sent = 0
        users_count = 0
        
        # Optionally send emails
        if send_emails:
            # Get users with their preferences
            users_with_preferences = digest_service.get_users_with_preferences(db)
            users_count = len(users_with_preferences)
            logger.info(f"Found {users_count} users to send digests to")
            
            # Send personalized emails to users
            if users_with_preferences and digest.article_json:
                normas_summaries = digest.article_json.get('normas', [])
                emails_sent = send_digest_to_users(
                    users_with_preferences=users_with_preferences,
                    week_start=digest.week_start,
                    week_end=digest.week_end,
                    normas_with_summaries=normas_summaries,
                    digest_service=digest_service
                )
        
        return {
            "success": True,
            "message": f"Digest generated successfully{' and emails sent' if send_emails else ' (no emails sent)'}",
            "digest_id": str(digest.id),
            "week_start": str(digest.week_start),
            "week_end": str(digest.week_end),
            "total_normas": digest.total_normas,
            "users_found": users_count if send_emails else 0,
            "emails_sent": emails_sent,
            "article_preview": digest.article_summary[:200] + "..." if digest.article_summary and len(digest.article_summary) > 200 else digest.article_summary
        }
        
    except Exception as e:
        logger.error(f"Error in test digest generation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating test digest: {str(e)}"
        )


@router.get("/digest/preferences/", response_model=UserPreferencesResponse)
async def get_user_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the current user's digest preferences.
    """
    logger.info(f"Fetching digest preferences for user {current_user.id}")
    
    try:
        preferences = db.query(DigestUserPreferences).filter(
            DigestUserPreferences.user_id == current_user.id
        ).first()
        
        if not preferences:
            # Return default empty preferences
            return UserPreferencesResponse(
                user_id=current_user.id,
                filter_options={}
            )
        
        return UserPreferencesResponse(
            user_id=preferences.user_id,
            filter_options=preferences.filter_options
        )
        
    except Exception as e:
        logger.error(f"Error fetching user preferences: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching preferences"
        )


@router.put("/digest/preferences/", response_model=UserPreferencesResponse)
async def update_user_preferences(
    request: UserPreferencesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the current user's digest preferences.
    
    Filter options can include:
    - tipo_norma: List of norma types to include
    - dependencia: List of dependencies to include
    - titulo_sumario: List of keywords to match in the titulo_sumario
    
    Example:
    {
        "filter_options": {
            "tipo_norma": ["LEY", "DECRETO"],
            "dependencia": ["MINISTERIO DE SALUD"],
            "titulo_sumario": ["educación", "salud"]
        }
    }
    """
    logger.info(f"Updating digest preferences for user {current_user.id}")
    
    try:
        preferences = db.query(DigestUserPreferences).filter(
            DigestUserPreferences.user_id == current_user.id
        ).first()
        
        if preferences:
            # Update existing preferences
            preferences.filter_options = request.filter_options
        else:
            # Create new preferences
            preferences = DigestUserPreferences(
                user_id=current_user.id,
                filter_options=request.filter_options
            )
            db.add(preferences)
        
        db.commit()
        db.refresh(preferences)
        
        return UserPreferencesResponse(
            user_id=preferences.user_id,
            filter_options=preferences.filter_options
        )
        
    except Exception as e:
        logger.error(f"Error updating user preferences: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating preferences"
        )


@router.get("/digest/weekly/", response_model=List[WeeklyDigestResponse])
async def list_weekly_digests(
    limit: int = 10,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    List past weekly digests.
    
    This endpoint returns the generic weekly digests that were generated,
    suitable for displaying on the website.
    """
    logger.info(f"Listing weekly digests (limit: {limit}, offset: {offset})")
    
    try:
        digests = db.query(DigestWeekly)\
            .order_by(DigestWeekly.week_start.desc())\
            .limit(limit)\
            .offset(offset)\
            .all()
        
        return [
            WeeklyDigestResponse(
                id=digest.id,
                week_start=digest.week_start,
                week_end=digest.week_end,
                article_summary=digest.article_summary,
                total_normas=digest.total_normas or 0,
                article_json=digest.article_json,
                created_at=digest.created_at.isoformat() if digest.created_at else None
            )
            for digest in digests
        ]
        
    except Exception as e:
        logger.error(f"Error listing weekly digests: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error listing digests"
        )


@router.get("/digest/weekly/{digest_id}/", response_model=WeeklyDigestResponse)
async def get_weekly_digest(
    digest_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific weekly digest by ID.
    """
    logger.info(f"Fetching weekly digest {digest_id}")
    
    try:
        digest = db.query(DigestWeekly).filter(DigestWeekly.id == digest_id).first()
        
        if not digest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Digest not found"
            )
        
        return WeeklyDigestResponse(
            id=digest.id,
            week_start=digest.week_start,
            week_end=digest.week_end,
            article_summary=digest.article_summary,
            total_normas=digest.total_normas or 0,
            article_json=digest.article_json,
            created_at=digest.created_at.isoformat() if digest.created_at else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching weekly digest: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching digest"
        )


@router.get("/digest/weekly/latest/", response_model=Optional[WeeklyDigestResponse])
async def get_latest_weekly_digest(
    db: Session = Depends(get_db)
):
    """
    Get the most recent weekly digest.
    
    Useful for displaying the current week's digest on the home page.
    """
    logger.info("Fetching latest weekly digest")
    
    try:
        digest = db.query(DigestWeekly)\
            .order_by(DigestWeekly.week_start.desc())\
            .first()
        
        if not digest:
            return None
        
        return WeeklyDigestResponse(
            id=digest.id,
            week_start=digest.week_start,
            week_end=digest.week_end,
            article_summary=digest.article_summary,
            total_normas=digest.total_normas or 0,
            article_json=digest.article_json,
            created_at=digest.created_at.isoformat() if digest.created_at else None
        )
        
    except Exception as e:
        logger.error(f"Error fetching latest weekly digest: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching latest digest"
        )

