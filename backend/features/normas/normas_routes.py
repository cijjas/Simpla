"""Router for normas-related endpoints."""

from typing import Optional
from datetime import date
from fastapi import APIRouter, HTTPException, status, Query
from core.utils.logging_config import get_logger

from shared.utils.norma_reconstruction import get_norma_reconstructor
from .normas_schemas import (
    NormaSummaryResponse,
    NormaDetailResponse,
    NormaSearchResponse,
    NormaStatsResponse,
    NormaFilterOptionsResponse,
    NormaBatchRequest,
    NormaBatchResponse,
    NormaRelacionesResponse,
    NormaRelacionNode,
    NormaRelacionLink
)

logger = get_logger(__name__)
router = APIRouter()

# Initialize the reconstructor
reconstructor = get_norma_reconstructor()


@router.get("/normas/", response_model=NormaSearchResponse)
async def list_normas(
    search_term: Optional[str] = Query(None, description="Search term to filter normas by text"),
    numero: Optional[int] = Query(None, description="Filter by norma number (numero)"),
    dependencia: Optional[str] = Query(None, description="Filter by dependencia"),
    titulo_sumario: Optional[str] = Query(None, description="Filter by titulo_sumario"),
    jurisdiccion: Optional[str] = Query(None, description="Filter by jurisdiction"),
    tipo_norma: Optional[str] = Query(None, description="Filter by norma type"),
    clase_norma: Optional[str] = Query(None, description="Filter by norma class"),
    estado: Optional[str] = Query(None, description="Filter by status"),
    año_sancion: Optional[int] = Query(None, description="Filter by year of sanction", ge=1810),
    sancion_desde: Optional[date] = Query(None, description="Filter normas sanctioned from this date"),
    sancion_hasta: Optional[date] = Query(None, description="Filter normas sanctioned until this date"),
    publicacion_desde: Optional[date] = Query(None, description="Filter normas published from this date"),
    publicacion_hasta: Optional[date] = Query(None, description="Filter normas published until this date"),
    nro_boletin: Optional[str] = Query(None, description="Filter by bulletin number"),
    pag_boletin: Optional[str] = Query(None, description="Filter by bulletin page"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip")
):
    """
    List normas with optional filters (returns summaries without full structure).
    This endpoint is optimized for bulk operations like browsing and searching.
    """
    logger.info(f"Listing normas with filters - search_term: {search_term}, "
                f"numero: {numero}, dependencia: {dependencia}, titulo_sumario: {titulo_sumario}, "
                f"jurisdiccion: {jurisdiccion}, tipo_norma: {tipo_norma}, limit: {limit}")
    
    try:
        normas, total_count = reconstructor.search_normas(
            search_term=search_term,
            numero=numero,
            dependencia=dependencia,
            titulo_sumario=titulo_sumario,
            jurisdiccion=jurisdiccion,
            tipo_norma=tipo_norma,
            clase_norma=clase_norma,
            estado=estado,
            año_sancion=año_sancion,
            sancion_desde=sancion_desde,
            sancion_hasta=sancion_hasta,
            publicacion_desde=publicacion_desde,
            publicacion_hasta=publicacion_hasta,
            nro_boletin=nro_boletin,
            pag_boletin=pag_boletin,
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
                cur.execute("SELECT COUNT(*) FROM normas_structured")
                total_normas = cur.fetchone()[0]
                
                cur.execute("SELECT COUNT(*) FROM divisions")
                total_divisions = cur.fetchone()[0]
                
                cur.execute("SELECT COUNT(*) FROM articles")
                total_articles = cur.fetchone()[0]
                
                # Get normas by jurisdiction
                cur.execute("""
                    SELECT jurisdiccion, COUNT(*) 
                    FROM normas_structured 
                    WHERE jurisdiccion IS NOT NULL 
                    GROUP BY jurisdiccion 
                    ORDER BY COUNT(*) DESC
                """)
                normas_by_jurisdiction = dict(cur.fetchall())
                
                # Get normas by type
                cur.execute("""
                    SELECT tipo_norma, COUNT(*) 
                    FROM normas_structured 
                    WHERE tipo_norma IS NOT NULL 
                    GROUP BY tipo_norma 
                    ORDER BY COUNT(*) DESC
                """)
                normas_by_type = dict(cur.fetchall())
                
                # Get normas by status
                cur.execute("""
                    SELECT estado, COUNT(*) 
                    FROM normas_structured 
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


@router.post("/normas/batch/", response_model=NormaBatchResponse)
async def get_normas_batch(request: NormaBatchRequest):
    """
    Get multiple norma summaries in a single request by their infoleg_ids.
    This endpoint is optimized for bulk operations and returns only summaries.
    Uses a single SQL query for efficient batch fetching.
    IDs that are not found will be returned in the not_found_ids list.
    """
    logger.info(f"Fetching batch of {len(request.infoleg_ids)} norma summaries")
    
    try:
        # Fetch all normas in a single database query
        normas_data = reconstructor.get_normas_summaries_batch(request.infoleg_ids)
        
        # Convert to response models
        normas = [NormaSummaryResponse(**norma_data) for norma_data in normas_data]
        
        # Determine which IDs were not found
        found_ids = {norma.infoleg_id for norma in normas}
        not_found_ids = [
            infoleg_id for infoleg_id in request.infoleg_ids 
            if infoleg_id not in found_ids
        ]
        
        logger.info(f"Successfully fetched {len(normas)} normas, {len(not_found_ids)} not found")
        return NormaBatchResponse(normas=normas, not_found_ids=not_found_ids)
        
    except Exception as e:
        logger.error(f"Error fetching batch normas: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching batch normas: {str(e)}"
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


@router.get("/normas/{infoleg_id}/relaciones/", response_model=NormaRelacionesResponse)
async def get_norma_relaciones(infoleg_id: int):
    """
    Get relationships (modifica/modificada_por) for a norma with graph data.
    Returns nodes and links suitable for D3 force-directed graph visualization.
    """
    logger.info(f"Fetching relationships for norma infoleg_id: {infoleg_id}")
    
    try:
        with reconstructor.get_connection() as conn:
            with conn.cursor() as cur:
                # First check if the norma exists
                cur.execute("""
                    SELECT ns.infoleg_id, ns.titulo_resumido, ns.titulo_sumario, ns.tipo_norma, 
                           nr.numero, ns.sancion
                    FROM normas_structured ns
                    LEFT JOIN normas_referencias nr ON ns.id = nr.norma_id
                    WHERE ns.infoleg_id = %s
                """, (infoleg_id,))
                
                current_norma_row = cur.fetchone()
                if not current_norma_row:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Norma with infoleg_id {infoleg_id} not found"
                    )
                
                # Create current norma node
                current_norma = NormaRelacionNode(
                    infoleg_id=current_norma_row[0],
                    titulo=current_norma_row[1] or current_norma_row[2],
                    titulo_resumido=current_norma_row[1],
                    tipo_norma=current_norma_row[3],
                    numero=current_norma_row[4],
                    sancion=current_norma_row[5]
                )
                
                # Get all relationships where this norma is the origin
                cur.execute("""
                    SELECT norma_destino_infoleg_id, tipo_relacion
                    FROM normas_relaciones
                    WHERE norma_origen_infoleg_id = %s
                """, (infoleg_id,))
                
                outgoing_relations = cur.fetchall()
                
                # Get all relationships where this norma is the destination
                cur.execute("""
                    SELECT norma_origen_infoleg_id, tipo_relacion
                    FROM normas_relaciones
                    WHERE norma_destino_infoleg_id = %s
                """, (infoleg_id,))
                
                incoming_relations = cur.fetchall()
                
                # Collect all related norma IDs
                related_ids = set()
                for rel in outgoing_relations:
                    related_ids.add(rel[0])
                for rel in incoming_relations:
                    related_ids.add(rel[0])
                
                # Fetch norma details for all related normas
                nodes = []
                links = []
                
                if related_ids:
                    placeholders = ','.join(['%s'] * len(related_ids))
                    cur.execute(f"""
                        SELECT ns.infoleg_id, ns.titulo_resumido, ns.titulo_sumario, ns.tipo_norma,
                               nr.numero, ns.sancion
                        FROM normas_structured ns
                        LEFT JOIN normas_referencias nr ON ns.id = nr.norma_id
                        WHERE ns.infoleg_id IN ({placeholders})
                    """, list(related_ids))
                    
                    related_normas = cur.fetchall()
                    
                    # Create nodes for related normas
                    for norma_row in related_normas:
                        nodes.append(NormaRelacionNode(
                            infoleg_id=norma_row[0],
                            titulo=norma_row[1] or norma_row[2],
                            titulo_resumido=norma_row[1],
                            tipo_norma=norma_row[3],
                            numero=norma_row[4],
                            sancion=norma_row[5]
                        ))
                
                # Create links for outgoing relationships
                for rel in outgoing_relations:
                    links.append(NormaRelacionLink(
                        source_infoleg_id=infoleg_id,
                        target_infoleg_id=rel[0],
                        tipo_relacion=rel[1]
                    ))
                
                # Create links for incoming relationships
                for rel in incoming_relations:
                    links.append(NormaRelacionLink(
                        source_infoleg_id=rel[0],
                        target_infoleg_id=infoleg_id,
                        tipo_relacion=rel[1]
                    ))
                
                return NormaRelacionesResponse(
                    current_norma=current_norma,
                    nodes=nodes,
                    links=links
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching relationships for norma {infoleg_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching norma relationships: {str(e)}"
        )