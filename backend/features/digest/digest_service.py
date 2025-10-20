"""Service layer for weekly digest generation."""

import asyncio
from datetime import date, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from core.utils.logging_config import get_logger
from features.conversations.ai_service import get_ai_service_instance
from features.conversations.ai_services.base import Message
from shared.utils.norma_reconstruction import get_norma_reconstructor
from .digest_models import DigestWeekly, DigestUserPreferences
from features.auth.auth_models import User
import uuid

logger = get_logger(__name__)


class DigestService:
    """Service for generating and managing weekly digests."""
    
    def __init__(self):
        self.ai_service = get_ai_service_instance()
        self.reconstructor = get_norma_reconstructor()
    
    def _get_week_dates(self, custom_start: Optional[date] = None, custom_end: Optional[date] = None) -> Tuple[date, date]:
        """Get the start (Monday) and end (Friday) dates for the current week or custom dates."""
        if custom_start and custom_end:
            return custom_start, custom_end
        
        today = date.today()
        # Get the Monday of the current week
        days_since_monday = today.weekday()  # Monday = 0, Sunday = 6
        week_start = today - timedelta(days=days_since_monday)
        
        # Friday is 4 days after Monday
        week_end = week_start + timedelta(days=4)
        
        return week_start, week_end
    
    def _fetch_weekly_normas(self, week_start: date, week_end: date) -> List[Dict[str, Any]]:
        """Fetch normas published in the given week."""
        logger.info(f"Fetching normas from {week_start} to {week_end}")
        
        try:
            with self.reconstructor.get_connection() as conn:
                with conn.cursor() as cur:
                    logger.info(f"Fetching normas from {week_start} to {week_end}")
                    cur.execute("""
                        SELECT 
                            ns.id,
                            ns.infoleg_id,
                            ns.tipo_norma,
                            nr.numero,
                            ns.titulo_resumido,
                            ns.titulo_sumario,
                            ns.purified_texto_norma_actualizado,
                            ns.purified_texto_norma,
                            ns.texto_resumido,
                            ns.texto_norma_actualizado,
                            ns.texto_norma,
                            ns.publicacion,
                            ns.sancion,
                            nr.dependencia
                        FROM normas_structured ns
                        LEFT JOIN normas_referencias nr ON ns.id = nr.norma_id
                        WHERE ns.publicacion >= %s AND ns.publicacion <= %s
                        ORDER BY ns.publicacion DESC
                    """, (week_start, week_end))
                    
                    columns = [desc[0] for desc in cur.description]
                    normas = []
                    
                    for row in cur.fetchall():
                        norma_dict = dict(zip(columns, row))
                        normas.append(norma_dict)
                    
                    logger.info(f"Found {len(normas)} normas for the week")
                    return normas
        except Exception as e:
            logger.error(f"Error fetching weekly normas: {str(e)}", exc_info=True)
            return []
    
    def _filter_relevant_normas(self, normas: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter out empty or irrelevant normas."""
        filtered = []
        
        for norma in normas:
            # Filter criteria:
            # 1. Must have content (priority: purified_texto_norma_actualizado > purified_texto_norma > texto_resumido > texto_norma_actualizado > texto_norma)
            # 2. Must have a title (priority: titulo_resumido > titulo_sumario)
            # 3. Must have publicacion date
            
            has_content = bool(
                norma.get('purified_texto_norma_actualizado') or 
                norma.get('purified_texto_norma') or 
                norma.get('texto_resumido') or 
                norma.get('texto_norma_actualizado') or 
                norma.get('texto_norma')
            )
            has_title = bool(norma.get('titulo_resumido') or norma.get('titulo_sumario'))
            has_publication = bool(norma.get('publicacion'))
            
            if has_content and has_title and has_publication:
                filtered.append(norma)
            else:
                logger.debug(f"Filtered out norma {norma.get('infoleg_id')} - missing required fields")
        
        logger.info(f"Filtered to {len(filtered)} relevant normas from {len(normas)} total")
        return filtered
    
    async def _generate_norma_summary(self, norma: Dict[str, Any]) -> str:
        """Generate a summary for a single norma using LLM."""
        try:
            # Prepare content for summarization
            # Priority: titulo_resumido > titulo_sumario
            titulo = norma.get('titulo_resumido') or norma.get('titulo_sumario', 'Sin título')
            # Priority: purified_texto_norma_actualizado > purified_texto_norma > texto_resumido > texto_norma_actualizado > texto_norma
            content = (
                norma.get('purified_texto_norma_actualizado') or 
                norma.get('purified_texto_norma') or 
                norma.get('texto_resumido') or 
                norma.get('texto_norma_actualizado') or 
                norma.get('texto_norma') or 
                ''
            )
            tipo_norma = norma.get('tipo_norma', 'Norma')
            numero = norma.get('numero', '')
            
            # Truncate very long content to avoid token limits
            max_chars = 8000
            if len(content) > max_chars:
                content = content[:max_chars] + "..."
            
            system_prompt = """Sos un asistente legal especializado en derecho argentino. 
Tu tarea es generar resúmenes concisos de normas legales, destacando los puntos más relevantes y las conclusiones principales.
El resumen debe ser claro, profesional y útil para profesionales del derecho."""
            
            user_prompt = f"""Resumí la siguiente norma legal en español, destacando los puntos más relevantes y las conclusiones principales.
El resumen debe tener entre 100 y 200 palabras.

Tipo: {tipo_norma} {numero}
Título: {titulo}

Contenido:
{content}

Generá un resumen que capture la esencia de esta norma y sus implicancias más importantes."""
            
            messages = [Message(role="user", content=user_prompt)]
            
            # Generate summary by streaming (we'll collect all chunks)
            summary_parts = []
            async for chunk in self.ai_service.generate_stream(messages, system_prompt):
                summary_parts.append(chunk)
            
            summary = ''.join(summary_parts)
            logger.info(f"Generated summary for norma {norma.get('infoleg_id')}")
            
            return summary.strip()
            
        except Exception as e:
            logger.error(f"Error generating summary for norma {norma.get('infoleg_id')}: {str(e)}", exc_info=True)
            # Fallback to content with same priority order
            return (
                norma.get('purified_texto_norma_actualizado') or 
                norma.get('purified_texto_norma') or 
                norma.get('texto_resumido') or 
                norma.get('texto_norma_actualizado') or 
                norma.get('texto_norma') or 
                'No se pudo generar el resumen.'
            )
    
    async def _generate_summaries_for_normas(self, normas: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate summaries for all normas concurrently."""
        logger.info(f"Generating summaries for {len(normas)} normas")
        
        # Create tasks for concurrent processing
        # To avoid overwhelming the API, we'll process in batches
        batch_size = 5
        normas_with_summaries = []
        
        for i in range(0, len(normas), batch_size):
            batch = normas[i:i + batch_size]
            tasks = [self._generate_norma_summary(norma) for norma in batch]
            summaries = await asyncio.gather(*tasks)
            
            for norma, summary in zip(batch, summaries):
                # Convert date to string for JSON serialization
                publicacion = norma.get('publicacion')
                if publicacion and isinstance(publicacion, date):
                    publicacion = publicacion.isoformat()
                
                normas_with_summaries.append({
                    'infoleg_id': norma['infoleg_id'],
                    'tipo_norma': norma.get('tipo_norma'),
                    'numero': norma.get('numero'),
                    'titulo_sumario': norma.get('titulo_sumario'),
                    'titulo': norma.get('titulo_resumido') or norma.get('titulo_sumario'),
                    'summary': summary,
                    'publicacion': publicacion,
                    'dependencia': norma.get('dependencia')
                })
            
            # Small delay between batches
            if i + batch_size < len(normas):
                await asyncio.sleep(1)
        
        logger.info(f"Generated {len(normas_with_summaries)} summaries")
        return normas_with_summaries
    
    async def _generate_weekly_article(self, normas_with_summaries: List[Dict[str, Any]]) -> str:
        """Generate a comprehensive weekly digest article from all summaries."""
        logger.info("Generating weekly digest article")
        
        try:
            # Prepare consolidated content
            summaries_text = "\n\n".join([
                f"**{s['tipo_norma']} {s['numero']}** - {s['titulo']}\n{s['summary']}"
                for s in normas_with_summaries
            ])
            
            system_prompt = """Sos un editor legal especializado en derecho argentino.
Tu tarea es crear un artículo resumen semanal que consolide todas las normas publicadas durante la semana.
El artículo debe ser profesional, bien estructurado, y proporcionar una visión general útil para profesionales del derecho."""
            
            user_prompt = f"""Creá un artículo resumen de las normas legales publicadas esta semana en Argentina.
El artículo debe:
- Tener una introducción que mencione el total de normas ({len(normas_with_summaries)})
- Agrupar las normas por temas o categorías relevantes
- Destacar las normas más importantes o de mayor impacto
- Incluir una conclusión breve
- Estar escrito en un tono profesional pero accesible
- Tener entre 400 y 600 palabras

Normas de la semana:
{summaries_text}

Generá el artículo resumen semanal."""
            
            messages = [Message(role="user", content=user_prompt)]
            
            # Generate article
            article_parts = []
            async for chunk in self.ai_service.generate_stream(messages, system_prompt):
                article_parts.append(chunk)
            
            article = ''.join(article_parts)
            logger.info("Generated weekly digest article")
            
            return article.strip()
            
        except Exception as e:
            logger.error(f"Error generating weekly article: {str(e)}", exc_info=True)
            # Fallback to a simple concatenation
            return f"Resumen de {len(normas_with_summaries)} normas publicadas esta semana.\n\n" + summaries_text
    
    async def generate_weekly_digest(
        self,
        db: Session,
        custom_start: Optional[date] = None,
        custom_end: Optional[date] = None
    ) -> DigestWeekly:
        """
        Main method to generate the weekly digest.
        
        Steps:
        1. Fetch normas from the week
        2. Filter relevant normas
        3. Generate summaries for each norma
        4. Generate consolidated weekly article
        5. Store in database
        """
        week_start, week_end = self._get_week_dates(custom_start, custom_end)
        logger.info(f"Starting weekly digest generation for {week_start} to {week_end}")
        
        # Check if digest already exists for this week
        existing_digest = db.query(DigestWeekly).filter(
            DigestWeekly.week_start == week_start,
            DigestWeekly.week_end == week_end
        ).first()
        
        if existing_digest:
            logger.info(f"Digest already exists for week {week_start} to {week_end}")
            return existing_digest
        
        # Step 1: Fetch normas
        normas = self._fetch_weekly_normas(week_start, week_end)
        
        if not normas:
            logger.warning("No normas found for the week")
            # Create empty digest
            digest = DigestWeekly(
                id=uuid.uuid4(),
                week_start=week_start,
                week_end=week_end,
                article_summary="No se publicaron normas esta semana.",
                total_normas=0,
                article_json={'normas': []}
            )
            db.add(digest)
            db.commit()
            return digest
        
        # Step 2: Filter relevant normas
        filtered_normas = self._filter_relevant_normas(normas)
        
        if not filtered_normas:
            logger.warning("No relevant normas after filtering")
            digest = DigestWeekly(
                id=uuid.uuid4(),
                week_start=week_start,
                week_end=week_end,
                article_summary="No se encontraron normas relevantes esta semana.",
                total_normas=0,
                article_json={'normas': []}
            )
            db.add(digest)
            db.commit()
            return digest
        
        # Step 3: Generate summaries
        normas_with_summaries = await self._generate_summaries_for_normas(filtered_normas)
        
        # Step 4: Generate weekly article
        weekly_article = await self._generate_weekly_article(normas_with_summaries)
        
        # Step 5: Store in database
        digest = DigestWeekly(
            id=uuid.uuid4(),
            week_start=week_start,
            week_end=week_end,
            article_summary=weekly_article,
            total_normas=len(normas_with_summaries),
            article_json={'normas': normas_with_summaries}
        )
        
        db.add(digest)
        db.commit()
        db.refresh(digest)
        
        logger.info(f"Successfully created weekly digest {digest.id}")
        return digest
    
    def filter_normas_for_user(
        self,
        user_preferences: Dict[str, Any],
        normas_with_summaries: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Filter normas based on user preferences (tipo_norma, dependencia, titulo_sumario).
        
        Logic: If user has no preferences, include all normas.
        If user has preferences, include norma if it matches ANY of the preferences (OR logic).
        """
        # Check if user has any actual preferences
        has_preferences = False
        if user_preferences:
            has_preferences = bool(
                (user_preferences.get('tipo_norma') and isinstance(user_preferences['tipo_norma'], list) and len(user_preferences['tipo_norma']) > 0) or
                (user_preferences.get('dependencia') and isinstance(user_preferences['dependencia'], list) and len(user_preferences['dependencia']) > 0) or
                (user_preferences.get('titulo_sumario') and isinstance(user_preferences['titulo_sumario'], (list, str)) and (
                    (isinstance(user_preferences['titulo_sumario'], list) and len(user_preferences['titulo_sumario']) > 0) or
                    (isinstance(user_preferences['titulo_sumario'], str) and user_preferences['titulo_sumario'])
                ))
            )
        
        if not has_preferences:
            # No preferences, return all
            return normas_with_summaries
        
        filtered = []
        
        for norma in normas_with_summaries:
            # OR logic: include if norma matches ANY preference
            matches_any = False
            
            # Check tipo_norma match
            if 'tipo_norma' in user_preferences and user_preferences['tipo_norma']:
                allowed_types = user_preferences['tipo_norma']
                if isinstance(allowed_types, list) and norma.get('tipo_norma') in allowed_types:
                    matches_any = True
            
            # Check dependencia match
            if 'dependencia' in user_preferences and user_preferences['dependencia']:
                allowed_dependencias = user_preferences['dependencia']
                if isinstance(allowed_dependencias, list) and norma.get('dependencia') in allowed_dependencias:
                    matches_any = True
            
            # Check titulo_sumario keyword match
            if 'titulo_sumario' in user_preferences and user_preferences['titulo_sumario']:
                keywords = user_preferences['titulo_sumario']
                titulo_sumario = norma.get('titulo_sumario', '').lower()
                
                if isinstance(keywords, list):
                    # Check if any keyword is in the titulo_sumario
                    if any(keyword.lower() in titulo_sumario for keyword in keywords):
                        matches_any = True
                elif isinstance(keywords, str):
                    if keywords.lower() in titulo_sumario:
                        matches_any = True
            
            if matches_any:
                filtered.append(norma)
        
        return filtered
    
    def get_users_with_preferences(self, db: Session) -> List[Tuple[User, Dict[str, Any]]]:
        """Get all users with their digest preferences using efficient JOIN query."""
        # Use LEFT JOIN to get users and their preferences in a single query
        # Filter for verified, non-deleted users
        # only users from digest_user_preferences table
        results = db.query(User, DigestUserPreferences).join(
            DigestUserPreferences, User.id == DigestUserPreferences.user_id
        ).filter(
            DigestUserPreferences.user_id.in_(
                db.query(DigestUserPreferences.user_id).distinct()
            )
        ).all()
        
        # Convert to list of tuples (user, preferences_dict)
        user_preferences_list = [
            (user, prefs.filter_options if prefs else {})
            for user, prefs in results
        ]
        
        return user_preferences_list

