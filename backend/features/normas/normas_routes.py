"""Router for normas-related endpoints."""

from typing import Optional
from datetime import date
from fastapi import APIRouter, HTTPException, status, Query, Depends
from core.utils.logging_config import get_logger
import json
import psycopg2
from psycopg2.extras import RealDictCursor

from shared.utils.norma_reconstruction import get_norma_reconstructor
from features.auth.auth_utils import get_current_user_id
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
router = APIRouter(dependencies=[Depends(get_current_user_id)])

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


@router.get("/normas/relaciones/all/", response_model=NormaRelacionesResponse)
async def get_all_normas_relaciones(
    limit: int = Query(500, ge=1, le=1000, description="Maximum number of relationships to return")
):
    """
    Get all norma relationships for graph visualization.
    Returns nodes and links suitable for D3 force-directed graph visualization.
    Limited to prevent performance issues with large datasets.
    """
    logger.info(f"Fetching all norma relationships (limit: {limit})")
    
    try:
        with reconstructor.get_connection() as conn:
            with conn.cursor() as cur:
                # Get a sample of relationships
                cur.execute("""
                    SELECT nr.norma_origen_infoleg_id, nr.norma_destino_infoleg_id, nr.tipo_relacion
                    FROM normas_relaciones nr
                    ORDER BY nr.id
                    LIMIT %s    
                """, (limit,))
                
                relations = cur.fetchall()
                
                if not relations:
                    # Return an empty graph with a minimal placeholder current_norma to satisfy schema
                    placeholder_node = NormaRelacionNode(
                        infoleg_id=0,
                        titulo="",
                    )
                    return NormaRelacionesResponse(
                        current_norma=placeholder_node,
                        nodes=[],
                        links=[]
                    )
                
                # Collect all unique norma IDs
                norma_ids = set()
                for rel in relations:
                    norma_ids.add(rel[0])  # origen
                    norma_ids.add(rel[1])  # destino
                
                # Fetch details for all normas
                placeholders = ','.join(['%s'] * len(norma_ids))
                cur.execute(f"""
                    SELECT ns.infoleg_id, ns.titulo_resumido, ns.titulo_sumario, ns.tipo_norma,
                           nr.numero, ns.sancion
                    FROM normas_structured ns
                    LEFT JOIN normas_referencias nr ON ns.id = nr.norma_id
                    WHERE ns.infoleg_id IN ({placeholders})
                """, list(norma_ids))
                
                normas_data = cur.fetchall()
                
                # Create nodes
                nodes = []
                for norma_row in normas_data:
                    nodes.append(NormaRelacionNode(
                        infoleg_id=norma_row[0],
                        titulo=norma_row[1] or norma_row[2],
                        titulo_resumido=norma_row[1],
                        tipo_norma=norma_row[3],
                        numero=norma_row[4],
                        sancion=norma_row[5]
                    ))
                
                # Create links
                links = []
                for rel in relations:
                    links.append(NormaRelacionLink(
                        source_infoleg_id=rel[0],
                        target_infoleg_id=rel[1],
                        tipo_relacion=rel[2]
                    ))
                
                # Per schema, current_norma cannot be null; choose first node if available
                current = nodes[0] if nodes else NormaRelacionNode(infoleg_id=0, titulo="")
                return NormaRelacionesResponse(
                    current_norma=current,
                    nodes=nodes,
                    links=links
                )
                
    except Exception as e:
        logger.error(f"Error fetching all norma relationships: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching all norma relationships: {str(e)}"
        )


@router.post("/normas/daily-batch-complete")
async def normas_daily_batch_complete(batch_date: Optional[date] = None):
    """
    Generic endpoint to be called by the daily batch job once new normas have been
    inserted into the database. Responsibilities:
      - Refresh materialized views used by the filters
      - Find normas inserted during the previous day (or provided batch_date)
        and, for each norma, read `lista_normas_que_complementa` (the normas
        that it "complements" / modifies). For every user that has any of those
        complemented normas in their favorites, insert a `norm_update` row into
        the `notifications` table so they see an in-app notification.

    The endpoint is idempotent if called multiple times for the same batch window
    (it will insert notifications each time unless deduplication is implemented
    later).
    """
    try:
        logger.info("Received request: normas_daily_batch_complete, batch_date=%s", batch_date)

        # Determine date window: default to previous UTC day if not provided
        from datetime import datetime, timedelta, timezone

        # TEMPORARILY COMMENTED OUT FOR TESTING
        # now = datetime.now(timezone.utc)
        # if batch_date:
        #     # Interpret batch_date as the day that was processed (local date assumed UTC)
        #     start_dt = datetime(batch_date.year, batch_date.month, batch_date.day, tzinfo=timezone.utc)
        #     end_dt = start_dt + timedelta(days=1)
        # else:
        #     # previous day window
        #     prev_day = (now - timedelta(days=1)).date()
        #     start_dt = datetime(prev_day.year, prev_day.month, prev_day.day, tzinfo=timezone.utc)
        #     end_dt = start_dt + timedelta(days=1)

        # FOR TESTING: Look for normas published on 2021-08-24
        test_date = date(2021, 8, 24)
        logger.info("TEST MODE: Looking for normas published on %s", test_date)

        # Step A: Refresh materialized views first (so front-end filters pick up new values)
        try:
            reconstructor.refresh_materialized_views()
            logger.info("Materialized views refreshed successfully")
        except Exception as e:
            logger.warning("Materialized view refresh failed: %s", str(e))

        # Step B: Find normas inserted in that window and their relationships
        modified_norma_ids = set()  # normas that are modified by new normas
        new_normas = []  # collect basic info about new normas for notification metadata

        with reconstructor.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # First, get normas published on the test date (FOR TESTING)
                cur.execute(
                    """
                    SELECT ns.id, ns.infoleg_id, ns.titulo_resumido, ns.titulo_sumario
                    FROM normas_structured ns
                    WHERE ns.publicacion = %s
                    """,
                    (test_date,),
                )

                new_normas_rows = cur.fetchall()
                logger.info("Found %d normas published on test date", len(new_normas_rows))

                if not new_normas_rows:
                    logger.info("No normas found for test date; nothing to notify")
                    return {"success": True, "notified": 0, "message": "No normas found for test date"}

                # Collect new norma infoleg_ids
                new_infoleg_ids = [row['infoleg_id'] for row in new_normas_rows]
                new_normas = new_normas_rows  # store for metadata

                # Find relationships where new normas modify existing normas
                # We want outgoing relationships: new norma → existing norma
                cur.execute(
                    """
                    SELECT norma_origen_infoleg_id, norma_destino_infoleg_id, tipo_relacion
                    FROM normas_relaciones
                    WHERE norma_origen_infoleg_id = ANY(%s)
                    """,
                    (new_infoleg_ids,),
                )

                relations = cur.fetchall()
                logger.info("Found %d relationships where new normas modify existing normas", len(relations))

                # Collect the destination normas (the ones being modified)
                for rel in relations:
                    modified_norma_ids.add(rel['norma_destino_infoleg_id'])

        if not modified_norma_ids:
            logger.info("No modified norma ids found for this batch window; nothing to notify")
            return {"success": True, "notified": 0, "message": "No modified normas found"}

        logger.info("Total modified norma ids to check favorites: %d", len(modified_norma_ids))

        # Step C: Find favorites for those norma ids
        notifications_created = 0
        with reconstructor.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # fetch favorites for the modified normas
                cur.execute(
                    "SELECT user_id, norma_id FROM favorites WHERE is_deleted = false AND norma_id = ANY(%s)",
                    (list(modified_norma_ids),),
                )

                fav_rows = cur.fetchall()
                logger.info("Found %d favorite entries referencing complemented normas", len(fav_rows))

                # Insert notifications for each favorite
                for fav in fav_rows:
                    user_id = fav['user_id']
                    saved_norma_id = fav['norma_id']

                    # Find which new normas modify this saved norma using the relations we fetched
                    with reconstructor.get_connection() as conn2:
                        with conn2.cursor(cursor_factory=RealDictCursor) as cur2:
                            cur2.execute(
                                """
                                SELECT norma_origen_infoleg_id, tipo_relacion
                                FROM normas_relaciones
                                WHERE norma_destino_infoleg_id = %s 
                                AND norma_origen_infoleg_id = ANY(%s)
                                """,
                                (saved_norma_id, new_infoleg_ids),
                            )
                            modifying_relations = cur2.fetchall()

                    # Build metadata: include the list of new normas that modify this saved norma
                    modifying_new_normas = []
                    for rel in modifying_relations:
                        # Find the new norma details
                        for new_norma in new_normas:
                            if new_norma['infoleg_id'] == rel['norma_origen_infoleg_id']:
                                modifying_new_normas.append({
                                    "id": new_norma['id'], 
                                    "infoleg_id": new_norma['infoleg_id'],
                                    "titulo": new_norma['titulo_resumido'] or new_norma['titulo_sumario'],
                                    "tipo_relacion": rel['tipo_relacion']
                                })
                                break

                    # create a friendly title/body
                    title = "Posible modificación en una norma guardada"
                    body = f"Se publicó una norma nueva que podría modificar o complementar la norma que guardaste (ID {saved_norma_id})."
                    link = f"/normas/{saved_norma_id}"
                    metadata = {
                        "type": "norm_update",
                        "saved_norma_id": saved_norma_id,
                        "modifying_normas": modifying_new_normas
                    }

                    try:
                        cur.execute(
                            """
                            INSERT INTO notifications (user_id, title, body, type, link, metadata)
                            VALUES (%s, %s, %s, %s, %s, %s)
                            """,
                            (user_id, title, body, 'norm_update', link, json.dumps(metadata)),
                        )
                        notifications_created += 1
                    except Exception as e:
                        logger.error("Failed to insert notification for user %s: %s", user_id, str(e))

                conn.commit()

        logger.info("Notifications created: %d", notifications_created)
        return {"success": True, "notified": notifications_created}

    except Exception as e:
        logger.error(f"Error processing daily batch complete: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing daily batch complete: {str(e)}"
        )