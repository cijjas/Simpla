"""Router for normas-related endpoints."""

from typing import Optional
from datetime import date
from fastapi import APIRouter, HTTPException, status, Query
from core.utils.logging_config import get_logger

from .normas_reconstructor import NormaReconstructor
from .normas_schemas import (
    NormaSummaryResponse,
    NormaDetailResponse,
    NormaSearchResponse,
    NormaStatsResponse,
    NormaFilterOptionsResponse,
    ErrorResponse
)

logger = get_logger(__name__)
router = APIRouter()

# Initialize the reconstructor
reconstructor = NormaReconstructor()


@router.get("/normas/", response_model=NormaSearchResponse)
async def list_normas(
    search_term: Optional[str] = Query(None, description="Search term to filter normas"),
    jurisdiccion: Optional[str] = Query(None, description="Filter by jurisdiction"),
    tipo_norma: Optional[str] = Query(None, description="Filter by norma type"),
    clase_norma: Optional[str] = Query(None, description="Filter by norma class"),
    estado: Optional[str] = Query(None, description="Filter by status"),
    sancion_desde: Optional[date] = Query(None, description="Filter normas sanctioned from this date"),
    sancion_hasta: Optional[date] = Query(None, description="Filter normas sanctioned until this date"),
    publicacion_desde: Optional[date] = Query(None, description="Filter normas published from this date"),
    publicacion_hasta: Optional[date] = Query(None, description="Filter normas published until this date"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip")
):
    """
    List normas with optional filters (returns summaries without full structure).
    This endpoint is optimized for bulk operations like browsing and searching.
    """
    logger.info(f"Listing normas with filters - search_term: {search_term}, "
                f"jurisdiccion: {jurisdiccion}, tipo_norma: {tipo_norma}, limit: {limit}")
    
    try:
        normas, total_count = reconstructor.search_normas(
            search_term=search_term,
            jurisdiccion=jurisdiccion,
            tipo_norma=tipo_norma,
            clase_norma=clase_norma,
            estado=estado,
            sancion_desde=sancion_desde,
            sancion_hasta=sancion_hasta,
            publicacion_desde=publicacion_desde,
            publicacion_hasta=publicacion_hasta,
            limit=limit,
            offset=offset
        )
        
        # Convert to response format
        norma_summaries = [NormaSummaryResponse(**norma) for norma in normas]
        
        # Check if there are more results
        has_more = (offset + len(normas)) < total_count
        
        return NormaSearchResponse(
            normas=norma_summaries,
            total_count=total_count,
            has_more=has_more,
            limit=limit,
            offset=offset
        )
        
    except Exception as e:
        logger.error(f"Error listing normas: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing normas: {str(e)}"
        )


@router.get("/normas/filter-options/", response_model=NormaFilterOptionsResponse)
async def get_filter_options():
    """
    Get available filter options for normas.
    Returns unique values for jurisdictions, types, classes, and statuses.
    """
    logger.info("Fetching filter options")
    
    try:
        options = reconstructor.get_filter_options()
        return NormaFilterOptionsResponse(**options)
        
    except Exception as e:
        logger.error(f"Error fetching filter options: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching filter options: {str(e)}"
        )


@router.get("/normas/stats/", response_model=NormaStatsResponse)
async def get_normas_stats():
    """Get statistics about normas in the database."""
    logger.info("Fetching normas statistics")
    
    try:
        with reconstructor.get_connection() as conn:
            with conn.cursor() as cur:
                # Get total counts
                cur.execute("SELECT COUNT(*) FROM norma_structured")
                total_normas = cur.fetchone()[0]
                
                cur.execute("SELECT COUNT(*) FROM norma_divisions")
                total_divisions = cur.fetchone()[0]
                
                cur.execute("SELECT COUNT(*) FROM norma_articles")
                total_articles = cur.fetchone()[0]
                
                # Get normas by jurisdiction
                cur.execute("""
                    SELECT jurisdiccion, COUNT(*) 
                    FROM norma_structured 
                    WHERE jurisdiccion IS NOT NULL 
                    GROUP BY jurisdiccion 
                    ORDER BY COUNT(*) DESC
                """)
                normas_by_jurisdiction = dict(cur.fetchall())
                
                # Get normas by type
                cur.execute("""
                    SELECT tipo_norma, COUNT(*) 
                    FROM norma_structured 
                    WHERE tipo_norma IS NOT NULL 
                    GROUP BY tipo_norma 
                    ORDER BY COUNT(*) DESC
                """)
                normas_by_type = dict(cur.fetchall())
                
                # Get normas by status
                cur.execute("""
                    SELECT estado, COUNT(*) 
                    FROM norma_structured 
                    WHERE estado IS NOT NULL 
                    GROUP BY estado 
                    ORDER BY COUNT(*) DESC
                """)
                normas_by_status = dict(cur.fetchall())
        
        return NormaStatsResponse(
            total_normas=total_normas,
            total_divisions=total_divisions,
            total_articles=total_articles,
            normas_by_jurisdiction=normas_by_jurisdiction,
            normas_by_type=normas_by_type,
            normas_by_status=normas_by_status
        )
        
    except Exception as e:
        logger.error(f"Error fetching normas statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching normas statistics"
        )


@router.get("/normas/{infoleg_id}/summary/", response_model=NormaSummaryResponse)
async def get_norma_summary(infoleg_id: int):
    """
    Get a summary of a norma by its infoleg_id without the full hierarchical structure.
    This endpoint is lightweight and returns only the main fields.
    """
    logger.info(f"Fetching norma summary for infoleg_id: {infoleg_id}")
    
    try:
        norma_summary = reconstructor.get_norma_summary_by_infoleg_id(infoleg_id)
        
        if not norma_summary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Norma with infoleg_id {infoleg_id} not found"
            )
        
        return NormaSummaryResponse(**norma_summary)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching norma summary {infoleg_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching norma summary: {str(e)}"
        )


@router.get("/normas/{infoleg_id}/", response_model=NormaDetailResponse)
async def get_norma_detail(infoleg_id: int):
    """
    Get a complete norma by its infoleg_id with its full hierarchical structure.
    This endpoint reconstructs the entire norma with all divisions and articles.
    Use this when you need the complete document structure.
    """
    logger.info(f"Fetching norma detail for infoleg_id: {infoleg_id}")
    
    try:
        norma = reconstructor.reconstruct_norma_by_infoleg_id(infoleg_id)
        
        if not norma:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Norma with infoleg_id {infoleg_id} not found"
            )
        
        return NormaDetailResponse(**norma.model_dump())
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching norma {infoleg_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching norma details: {str(e)}"
        )