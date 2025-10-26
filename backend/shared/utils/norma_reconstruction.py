"""Shared norma reconstruction utilities for consistent norma processing across the application."""

import psycopg2
from psycopg2.extras import RealDictCursor
import json
from typing import Optional, List, Dict, Any
from urllib.parse import urlparse
from datetime import date
from contextlib import contextmanager

from .norma_models import NormaStructuredModel, DivisionModel, ArticleModel, NormaReferenciaModel
from core.config.config import settings
from core.utils.logging_config import get_logger

logger = get_logger(__name__)


class NormaReconstructor:
    """Class for reconstructing complete normas with their hierarchical structure."""
    
    def __init__(self):
        """Initialize the reconstructor with database configuration from settings."""
        self.db_config = self._parse_database_url(settings.DATABASE_URL)
        self._check_database_indexes()
    
    def _parse_database_url(self, database_url: str) -> dict:
        """Parse DATABASE_URL into connection parameters."""
        if not database_url:
            raise ValueError("DATABASE_URL is not configured")
        
        parsed = urlparse(database_url)
        
        return {
            'host': parsed.hostname,
            'database': parsed.path[1:],  # Remove leading slash
            'user': parsed.username,
            'password': parsed.password,
            'port': parsed.port or 5432
        }
    
    def _check_database_indexes(self):
        """Check if recommended database indexes exist and log warnings if missing."""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # Check for critical indexes
                    critical_indexes = [
                        'idx_normas_infoleg',
                        'idx_divisions_norma_id',
                        'idx_articles_division'
                    ]
                    
                    missing_indexes = []
                    for index_name in critical_indexes:
                        cur.execute("""
                            SELECT 1 FROM pg_indexes 
                            WHERE indexname = %s
                        """, (index_name,))
                        if not cur.fetchone():
                            missing_indexes.append(index_name)
                    
                    if missing_indexes:
                        logger.warning(
                            f"Missing critical database indexes: {missing_indexes}. "
                            f"Performance may be degraded. Run add_indexes.sql to fix this."
                        )
                    else:
                        logger.info("All critical database indexes are present")
                        
        except Exception as e:
            logger.warning(f"Could not check database indexes: {str(e)}")
    
    @contextmanager
    def get_connection(self):
        """Get a database connection with context manager."""
        conn = None
        try:
            conn = psycopg2.connect(**self.db_config)
            yield conn
        except psycopg2.Error as e:
            logger.error(f"Database connection error: {str(e)}")
            raise
        finally:
            if conn:
                conn.close()
    
    def reconstruct_norma(self, norma_id: int) -> Optional[NormaStructuredModel]:
        """Reconstruct a complete norma by its ID."""
        
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Get the main norma
                cur.execute("""
                    SELECT * FROM normas_structured 
                    WHERE id = %s
                """, (norma_id,))
                
                norma_row = cur.fetchone()
                if not norma_row:
                    return None
                
                # Convert row to dict and handle JSON fields
                norma_data = dict(norma_row)
                for json_field in ['id_normas', 'lista_normas_que_complementa', 'lista_normas_que_la_complementan', 'llm_models_used']:
                    if norma_data.get(json_field) and isinstance(norma_data[json_field], str):
                        try:
                            norma_data[json_field] = json.loads(norma_data[json_field])
                        except json.JSONDecodeError as e:
                            # Log the error and set to None for invalid JSON
                            logger.warning(f"Failed to parse JSON field '{json_field}' for norma {norma_id}: {str(e)}")
                            norma_data[json_field] = None
                
                # Get divisions and articles
                divisions = self._get_divisions_tree(cur, norma_id)
                norma_data['divisions'] = divisions
                
                # Get referencia
                referencia = self._get_norma_referencia(cur, norma_id)
                norma_data['referencia'] = referencia
                
                return NormaStructuredModel(**norma_data)
    
    def reconstruct_norma_by_infoleg_id(self, infoleg_id: int) -> Optional[NormaStructuredModel]:
        """Reconstruct a complete norma by its infoleg_id."""
        
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Get the main norma by infoleg_id
                cur.execute("""
                    SELECT * FROM normas_structured 
                    WHERE infoleg_id = %s
                """, (infoleg_id,))
                
                norma_row = cur.fetchone()
                if not norma_row:
                    return None
                
                # Convert row to dict and handle JSON fields
                norma_data = dict(norma_row)
                for json_field in ['id_normas', 'lista_normas_que_complementa', 'lista_normas_que_la_complementan', 'llm_models_used']:
                    if norma_data.get(json_field) and isinstance(norma_data[json_field], str):
                        try:
                            norma_data[json_field] = json.loads(norma_data[json_field])
                        except json.JSONDecodeError as e:
                            # Log the error and set to None for invalid JSON
                            logger.warning(f"Failed to parse JSON field '{json_field}' for infoleg_id {infoleg_id}: {str(e)}")
                            norma_data[json_field] = None
                
                # Get divisions and articles using the internal ID
                norma_id = norma_data['id']
                divisions = self._get_divisions_tree(cur, norma_id)
                norma_data['divisions'] = divisions
                
                # Get referencia
                referencia = self._get_norma_referencia(cur, norma_id)
                norma_data['referencia'] = referencia
                
                return NormaStructuredModel(**norma_data)
    
    def _get_divisions_tree(self, cur, norma_id: int) -> list[DivisionModel]:
        """Get all divisions for a norma in hierarchical structure."""
        
        # Get all divisions for this norma
        cur.execute("""
            SELECT * FROM divisions 
            WHERE norma_id = %s 
            ORDER BY order_index NULLS LAST
        """, (norma_id,))
        
        all_divisions = cur.fetchall()
        
        if not all_divisions:
            return []
        
        # Get all division IDs for batch article fetching
        division_ids = [div['id'] for div in all_divisions]
        
        # Get all articles for all divisions in a single query (fixes N+1 problem)
        articles_by_division = self._get_all_articles_for_divisions(cur, division_ids)
        
        # Build division hierarchy
        divisions_by_id = {}
        root_divisions = []
        
        for div_row in all_divisions:
            div_data = dict(div_row)
            
            # Assign articles from batch fetch
            div_data['articles'] = articles_by_division.get(div_data['id'], [])
            div_data['child_divisions'] = []
            
            division = DivisionModel(**div_data)
            divisions_by_id[division.id] = division
            
            if div_data['parent_division_id'] is None:
                root_divisions.append(division)
        
        # Build parent-child relationships efficiently (O(n) instead of O(n²))
        for div_row in all_divisions:
            if div_row['parent_division_id'] is not None:
                parent = divisions_by_id.get(div_row['parent_division_id'])
                child = divisions_by_id.get(div_row['id'])
                if parent and child:
                    parent.child_divisions.append(child)
        
        return root_divisions
    
    def _get_all_articles_for_divisions(self, cur, division_ids: list[int]) -> dict[int, list[ArticleModel]]:
        """Get all articles for multiple divisions in a single query to avoid N+1 problem."""
        if not division_ids:
            return {}
        
        # Create placeholders for the IN clause
        placeholders = ','.join(['%s'] * len(division_ids))
        
        cur.execute(f"""
            SELECT * FROM articles 
            WHERE division_id IN ({placeholders})
            ORDER BY division_id, order_index NULLS LAST
        """, division_ids)
        
        all_articles = cur.fetchall()
        
        # Group articles by division_id
        articles_by_division = {}
        for art_row in all_articles:
            division_id = art_row['division_id']
            if division_id not in articles_by_division:
                articles_by_division[division_id] = []
            articles_by_division[division_id].append(art_row)
        
        # Build hierarchical structure for each division's articles
        result = {}
        for division_id, articles in articles_by_division.items():
            result[division_id] = self._build_articles_hierarchy(articles)
        
        return result
    
    def _build_articles_hierarchy(self, articles: list) -> list[ArticleModel]:
        """Build hierarchical structure for articles efficiently."""
        if not articles:
            return []
        
        # Build article hierarchy
        articles_by_id = {}
        root_articles = []
        
        for art_row in articles:
            art_data = dict(art_row)
            art_data['child_articles'] = []
            
            article = ArticleModel(**art_data)
            articles_by_id[article.id] = article
            
            if art_data['parent_article_id'] is None:
                root_articles.append(article)
        
        # Build parent-child relationships efficiently (O(n) instead of O(n²))
        for art_row in articles:
            if art_row['parent_article_id'] is not None:
                parent = articles_by_id.get(art_row['parent_article_id'])
                child = articles_by_id.get(art_row['id'])
                if parent and child:
                    parent.child_articles.append(child)
        
        return root_articles
    
    def _get_articles_tree(self, cur, division_id: int) -> list[ArticleModel]:
        """Get all articles for a division in hierarchical structure."""
        # Use the new efficient batch method for consistency
        articles_by_division = self._get_all_articles_for_divisions(cur, [division_id])
        return articles_by_division.get(division_id, [])
    
    def _get_norma_referencia(self, cur, norma_id: int) -> Optional[NormaReferenciaModel]:
        """Get norma referencia for a single norma."""
        cur.execute("""
            SELECT * FROM normas_referencias
            WHERE norma_id = %s
            LIMIT 1
        """, (norma_id,))
        
        ref_row = cur.fetchone()
        if ref_row:
            return NormaReferenciaModel(**dict(ref_row))
        return None
    
    def get_norma_summary(self, norma_id: int) -> Optional[dict]:
        """Get a summary of a norma without the full hierarchical structure."""
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT 
                            id, infoleg_id, jurisdiccion, clase_norma, tipo_norma,
                            sancion, publicacion, titulo_sumario, titulo_resumido,
                            texto_resumido, observaciones, nro_boletin, pag_boletin, estado,
                            created_at, updated_at
                        FROM normas_structured 
                        WHERE id = %s
                    """, (norma_id,))
                    
                    norma_row = cur.fetchone()
                    if not norma_row:
                        return None
                    
                    norma_data = dict(norma_row)
                    
                    # Get referencia
                    referencia = self._get_norma_referencia(cur, norma_id)
                    if referencia:
                        norma_data['referencia'] = referencia.model_dump()
                    else:
                        norma_data['referencia'] = None
                    
                    return norma_data
        except psycopg2.Error as e:
            logger.error(f"Database error in get_norma_summary: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in get_norma_summary: {str(e)}")
            raise
    
    def get_norma_summary_by_infoleg_id(self, infoleg_id: int) -> Optional[dict]:
        """Get a norma summary by its infoleg_id (lightweight, no full structure)."""
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT 
                            id, infoleg_id, jurisdiccion, clase_norma, tipo_norma,
                            sancion, publicacion, titulo_sumario, titulo_resumido,
                            texto_resumido, observaciones, nro_boletin, pag_boletin, estado,
                            created_at, updated_at
                        FROM normas_structured 
                        WHERE infoleg_id = %s
                    """, (infoleg_id,))
                    
                    norma_row = cur.fetchone()
                    if not norma_row:
                        return None
                    
                    norma_data = dict(norma_row)
                    norma_id = norma_data['id']
                    
                    # Get referencia
                    referencia = self._get_norma_referencia(cur, norma_id)
                    if referencia:
                        norma_data['referencia'] = referencia.model_dump()
                    else:
                        norma_data['referencia'] = None
                    
                    return norma_data
        except psycopg2.Error as e:
            logger.error(f"Database error in get_norma_summary_by_infoleg_id: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in get_norma_summary_by_infoleg_id: {str(e)}")
            raise
    
    def get_normas_summaries_batch(self, infoleg_ids: List[int]) -> List[dict]:
        """
        Get multiple norma summaries in a single database query.
        Returns a list of norma dictionaries. Missing normas are not included in the result.
        """
        if not infoleg_ids:
            return []
        
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Fetch all normas in a single query using IN clause
                    cur.execute("""
                        SELECT 
                            id, infoleg_id, jurisdiccion, clase_norma, tipo_norma,
                            sancion, publicacion, titulo_sumario, titulo_resumido,
                            texto_resumido, observaciones, nro_boletin, pag_boletin, estado,
                            created_at, updated_at
                        FROM normas_structured 
                        WHERE infoleg_id = ANY(%s)
                    """, (infoleg_ids,))
                    
                    norma_rows = cur.fetchall()
                    if not norma_rows:
                        return []
                    
                    # Convert to dict and collect norma IDs for referencia lookup
                    normas_data = []
                    norma_ids = []
                    normas_by_id = {}
                    
                    for norma_row in norma_rows:
                        norma_data = dict(norma_row)
                        norma_id = norma_data['id']
                        normas_data.append(norma_data)
                        norma_ids.append(norma_id)
                        normas_by_id[norma_id] = norma_data
                    
                    # Fetch all referencias in a single query
                    if norma_ids:
                        cur.execute("""
                            SELECT 
                                id, norma_id, numero, dependencia, rama_digesto, created_at
                            FROM normas_referencias
                            WHERE norma_id = ANY(%s)
                        """, (norma_ids,))
                        
                        ref_rows = cur.fetchall()
                        
                        # Map referencias to their normas
                        for ref_row in ref_rows:
                            ref_dict = dict(ref_row)
                            norma_id = ref_dict['norma_id']
                            if norma_id in normas_by_id:
                                normas_by_id[norma_id]['referencia'] = ref_dict
                    
                    # Add None referencia for normas without one
                    for norma_data in normas_data:
                        if 'referencia' not in norma_data:
                            norma_data['referencia'] = None
                    
                    return normas_data
                    
        except psycopg2.Error as e:
            logger.error(f"Database error in get_normas_summaries_batch: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in get_normas_summaries_batch: {str(e)}")
            raise
    
    def search_normas(
        self,
        search_term: Optional[str] = None,
        numero: Optional[int] = None,
        dependencia: Optional[str] = None,
        titulo_sumario: Optional[str] = None,
        jurisdiccion: Optional[str] = None,
        tipo_norma: Optional[str] = None,
        clase_norma: Optional[str] = None,
        estado: Optional[str] = None,
        año_sancion: Optional[int] = None,
        sancion_desde: Optional[date] = None,
        sancion_hasta: Optional[date] = None,
        publicacion_desde: Optional[date] = None,
        publicacion_hasta: Optional[date] = None,
        nro_boletin: Optional[str] = None,
        pag_boletin: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> tuple[List[Dict[str, Any]], int]:
        """
        Search for normas with optional filters.
        Returns a tuple of (results, total_count).
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Determine if we need to join with normas_referencias
                    needs_referencia_join = numero is not None or dependencia is not None
                    
                    # Build the FROM clause
                    from_clause = "normas_structured ns"
                    if needs_referencia_join:
                        from_clause += " LEFT JOIN normas_referencias nr ON ns.id = nr.norma_id"
                    
                    # Build the WHERE clause dynamically
                    where_clauses = []
                    params = []
                    
                    if search_term:
                        # Use PostgreSQL full-text search if available, otherwise fall back to ILIKE
                        # This is more efficient for large datasets
                        where_clauses.append("""
                            (to_tsvector('spanish', COALESCE(ns.titulo_resumido, '') || ' ' || 
                                          COALESCE(ns.titulo_sumario, '') || ' ' || 
                                          COALESCE(ns.texto_resumido, '') || ' ' || 
                                          COALESCE(ns.observaciones, '')) @@ plainto_tsquery('spanish', %s)
                             OR
                             (ns.titulo_resumido ILIKE %s OR
                              ns.titulo_sumario ILIKE %s OR
                              ns.texto_resumido ILIKE %s OR
                              ns.observaciones ILIKE %s))
                        """)
                        search_pattern = f'%{search_term}%'
                        params.extend([search_term, search_pattern, search_pattern, search_pattern, search_pattern])
                    
                    if numero is not None:
                        where_clauses.append("nr.numero = %s")
                        params.append(numero)
                    
                    if dependencia:
                        where_clauses.append("nr.dependencia = %s")
                        params.append(dependencia)
                    
                    if titulo_sumario:
                        where_clauses.append("ns.titulo_sumario = %s")
                        params.append(titulo_sumario)
                    
                    if jurisdiccion:
                        where_clauses.append("ns.jurisdiccion = %s")
                        params.append(jurisdiccion)
                    
                    if tipo_norma:
                        where_clauses.append("ns.tipo_norma = %s")
                        params.append(tipo_norma)
                    
                    if clase_norma:
                        where_clauses.append("ns.clase_norma = %s")
                        params.append(clase_norma)
                    
                    if estado:
                        where_clauses.append("ns.estado = %s")
                        params.append(estado)
                    
                    if año_sancion:
                        where_clauses.append("EXTRACT(YEAR FROM ns.sancion) = %s")
                        params.append(año_sancion)
                    
                    if sancion_desde:
                        where_clauses.append("ns.sancion >= %s")
                        params.append(sancion_desde)
                    
                    if sancion_hasta:
                        where_clauses.append("ns.sancion <= %s")
                        params.append(sancion_hasta)
                    
                    if publicacion_desde:
                        where_clauses.append("ns.publicacion >= %s")
                        params.append(publicacion_desde)
                    
                    if publicacion_hasta:
                        where_clauses.append("ns.publicacion <= %s")
                        params.append(publicacion_hasta)
                    
                    if nro_boletin:
                        where_clauses.append("ns.nro_boletin = %s")
                        params.append(nro_boletin)
                    
                    if pag_boletin:
                        where_clauses.append("ns.pag_boletin = %s")
                        params.append(pag_boletin)
                    
                    where_sql = " AND ".join(where_clauses) if where_clauses else "TRUE"
                    
                    # Get total count
                    count_query = f"SELECT COUNT(DISTINCT ns.id) FROM {from_clause} WHERE {where_sql}"
                    cur.execute(count_query, params)
                    total_count = cur.fetchone()['count']
                    
                    # Get results (create new params list with limit and offset)
                    results_params = params + [limit, offset]
                    query = f"""
                        SELECT DISTINCT
                            ns.id, ns.infoleg_id, ns.jurisdiccion, ns.clase_norma, ns.tipo_norma,
                            ns.sancion, ns.publicacion, ns.titulo_sumario, ns.titulo_resumido,
                            ns.texto_resumido, ns.observaciones, ns.nro_boletin, ns.pag_boletin, ns.estado,
                            ns.created_at, ns.updated_at
                        FROM {from_clause}
                        WHERE {where_sql}
                        ORDER BY ns.publicacion DESC NULLS LAST, ns.sancion DESC NULLS LAST, ns.created_at DESC
                        LIMIT %s OFFSET %s
                    """
                    cur.execute(query, results_params)
                    
                    results = [dict(row) for row in cur.fetchall()]
                    
                    # Batch fetch referencias for all normas
                    if results:
                        norma_ids = [row['id'] for row in results]
                        placeholders = ','.join(['%s'] * len(norma_ids))
                        cur.execute(f"""
                            SELECT * FROM normas_referencias
                            WHERE norma_id IN ({placeholders})
                        """, norma_ids)
                        
                        referencias_rows = cur.fetchall()
                        referencias_by_norma = {ref['norma_id']: dict(ref) for ref in referencias_rows}
                        
                        # Add referencia to each result
                        for result in results:
                            result['referencia'] = referencias_by_norma.get(result['id'])
                    
                    return results, total_count
        
        except psycopg2.Error as e:
            logger.error(f"Database error in search_normas: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in search_normas: {str(e)}", exc_info=True)
            raise
    
    def get_filter_options(self) -> Dict[str, List[str]]:
        """Get available filter options for normas, ordered by popularity."""
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    options = {}
                    
                    # Get tipo_norma ordered by popularity (count DESC)
                    cur.execute("""
                        SELECT tipo_norma FROM tipos_norma ORDER BY count DESC, tipo_norma ASC;
                    """)
                    options['tipos_norma'] = [row['tipo_norma'] for row in cur.fetchall()]
                    
                    # Get dependencias ordered by popularity (count DESC)
                    cur.execute("""
                        SELECT dependencia FROM dependencias ORDER BY count DESC, dependencia ASC;
                    """)
                    options['dependencias'] = [row['dependencia'] for row in cur.fetchall()]
                    
                    # Get titulo_sumario ordered by popularity (count DESC)
                    cur.execute("""
                        SELECT titulo_sumario FROM titulos_sumario ORDER BY count DESC, titulo_sumario ASC;
                    """)
                    options['titulos_sumario'] = [row['titulo_sumario'] for row in cur.fetchall()]
                    
                    return options
        
        except psycopg2.Error as e:
            logger.error(f"Database error in get_filter_options: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in get_filter_options: {str(e)}")
            raise

    def refresh_materialized_views(self):
        """Refresh materialized views for filter options after batch inserts."""
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    
                    # Refresh each materialized view concurrently
                    logger.info("Refreshing materialized views...")

                    cur.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY tipos_norma;")
                    cur.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY dependencias;")
                    cur.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY titulos_sumario;")
                    
                    conn.commit()
                    logger.info("Materialized views refreshed successfully.")
        
        except psycopg2.Error as e:
            logger.error(f"Database error during materialized view refresh: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during materialized view refresh: {str(e)}")
            raise


# Convenience functions for quick access without needing to instantiate the class
_reconstructor_instance = None

def get_norma_reconstructor() -> NormaReconstructor:
    """Get a singleton instance of the NormaReconstructor."""
    global _reconstructor_instance
    if _reconstructor_instance is None:
        _reconstructor_instance = NormaReconstructor()
    return _reconstructor_instance


def reconstruct_norma_by_infoleg_id(infoleg_id: int) -> Optional[Dict[str, Any]]:
    """Convenience function to reconstruct a norma by infoleg_id and return as dict."""
    reconstructor = get_norma_reconstructor()
    norma_model = reconstructor.reconstruct_norma_by_infoleg_id(infoleg_id)
    if norma_model:
        return norma_model.model_dump()
    return None


def build_norma_text_context(norma_data: Dict[str, Any]) -> str:
    """Build comprehensive text context from norma data for AI processing."""
    context_parts = []
    
    # Add basic norma info
    if norma_data.get('titulo_resumido'):
        context_parts.append(f"Título: {norma_data['titulo_resumido']}")
    elif norma_data.get('titulo_sumario'):
        context_parts.append(f"Título: {norma_data['titulo_sumario']}")
    
    if norma_data.get('tipo_norma'):
        context_parts.append(f"Tipo: {norma_data['tipo_norma']}")
    
    if norma_data.get('sancion'):
        context_parts.append(f"Sanción: {norma_data['sancion']}")
        
    if norma_data.get('publicacion'):
        context_parts.append(f"Publicación: {norma_data['publicacion']}")
    
    # Add text content - prefer updated text over original
    if norma_data.get('texto_norma_actualizado'):
        context_parts.append(f"\nTexto actualizado de la norma:\n{norma_data['texto_norma_actualizado']}")
    elif norma_data.get('texto_norma'):
        context_parts.append(f"\nTexto de la norma:\n{norma_data['texto_norma']}")
    
    # Add structured divisions if available
    if norma_data.get('divisions'):
        context_parts.append("\nEstructura de la norma:")
        for division in norma_data['divisions']:
            _add_division_to_context(context_parts, division, level=1)
    
    return "\n".join(context_parts)


def _add_division_to_context(context_parts: List[str], division: Dict[str, Any], level: int):
    """Recursively add division content to context."""
    indent = "  " * level
    
    # Add division header
    div_header = f"{indent}- "
    if division.get('ordinal'):
        div_header += f"{division['ordinal']} "
    if division.get('name'):
        div_header += f"{division['name']}"
    if division.get('title'):
        div_header += f": {division['title']}"
    
    context_parts.append(div_header)
    
    # Add division body if available
    if division.get('body'):
        context_parts.append(f"{indent}  {division['body']}")
    
    # Add articles
    for article in division.get('articles', []):
        art_text = f"{indent}  • "
        if article.get('ordinal'):
            art_text += f"Art. {article['ordinal']}: "
        art_text += article.get('body', '')
        context_parts.append(art_text)
    
    # Add child divisions recursively
    for child_division in division.get('child_divisions', []):
        _add_division_to_context(context_parts, child_division, level + 1)