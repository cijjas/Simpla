"""Service layer for daily digest generation with newspaper-style structure."""

import asyncio
import json
import uuid
from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import time
from sqlalchemy.orm import Session
from core.utils.logging_config import get_logger
from features.conversations.ai_service import get_ai_service_instance
from features.conversations.ai_services.base import Message
from shared.utils.norma_reconstruction import get_norma_reconstructor
from .daily_digest_models import (
    DigestPreferences, 
    DailyDigestOrganismSummary, 
    NormaSummaryAnalysis,
    DailyDigestNewspaper
)
from features.auth.auth_models import User

logger = get_logger(__name__)


class DailyDigestService:
    """Service for generating newspaper-style daily digests."""
    
    # Editorial themes available for classification
    EDITORIAL_THEMES = [
        "Economía y Finanzas",
        "Trabajo y Empleo", 
        "Salud Pública",
        "Educación",
        "Infraestructura y Servicios",
        "Seguridad y Justicia",
        "Ambiente y Recursos",
        "Administración Pública",
        "Comercio Exterior",
        "Tecnología y Comunicaciones",
        "Cultura y Deportes"
    ]
    
    # Norma type hierarchy for ranking (highest to lowest priority)
    NORMA_TYPE_PRIORITY = {
        "Ley": 1,
        "Decreto": 2,  # Will be promoted to 1 if clase_norma is "DNU"
        "Resolución": 3,
        "Disposición": 4
    }
    
    def __init__(self):
        self.ai_service = get_ai_service_instance()
        self.reconstructor = get_norma_reconstructor()
        # Rate limiting tracking (15 requests per minute for Gemini)
        self.request_count = 0
        self.rate_limit_window_start = time.time()
        self.max_requests_per_minute = 14  # Stay slightly under limit
        self.request_interval = 60.0 / self.max_requests_per_minute  # ~4.3 seconds between requests
    
    def _fetch_daily_normas(self, target_date: date) -> List[Dict[str, Any]]:
        """Fetch normas published on the specified date."""
        logger.info(f"Fetching normas from {target_date}")
        
        try:
            with self.reconstructor.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT 
                            ns.id,
                            ns.infoleg_id,
                            ns.jurisdiccion,
                            ns.clase_norma,
                            ns.tipo_norma,
                            ns.sancion,
                            ns.publicacion,
                            ns.titulo_sumario,
                            ns.titulo_resumido,
                            ns.texto_resumido,
                            ns.texto_norma,
                            ns.estado,
                            nr.numero as numero_ref,
                            nr.dependencia,
                            nr.rama_digesto
                        FROM normas_structured ns
                        LEFT JOIN normas_referencias nr ON ns.id = nr.norma_id
                        WHERE ns.publicacion = %s
                        AND ns.jurisdiccion = 'Nacional'
                        ORDER BY ns.infoleg_id
                    """, (target_date,))
                    
                    normas = []
                    for row in cur.fetchall():
                        normas.append({
                            'id': row[0],
                            'infoleg_id': row[1],
                            'jurisdiccion': row[2],
                            'clase_norma': row[3],
                            'tipo_norma': row[4],
                            'sancion': row[5],
                            'publicacion': row[6],
                            'titulo_sumario': row[7],
                            'titulo_resumido': row[8],
                            'texto_resumido': row[9],
                            'texto_norma': row[10],
                            'estado': row[11],
                            'numero_ref': row[12],
                            'dependencia': row[13],
                            'rama_digesto': row[14]
                        })
                    
                    logger.info(f"Found {len(normas)} normas for {target_date}")
                    return normas
                    
        except Exception as e:
            logger.error(f"Error fetching normas: {str(e)}")
            raise
    
    def _filter_normas_for_newspaper(self, normas: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Filter normas for newspaper digest:
        1. Remove normas with titulo_sumario "PROCEDIMIENTOS ADMINISTRATIVOS"
        2. Remove normas with empty or minimal content
        """
        logger.info(f"Filtering {len(normas)} normas for newspaper digest")
        
        filtered_normas = []
        
        for norma in normas:
            # Skip "PROCEDIMIENTOS ADMINISTRATIVOS"
            if norma.get('titulo_sumario') == "PROCEDIMIENTOS ADMINISTRATIVOS":
                logger.debug(f"Filtering out norma {norma['infoleg_id']}: PROCEDIMIENTOS ADMINISTRATIVOS")
                continue
            
            # Skip normas with no substantive content
            texto_resumido = norma.get('texto_resumido', '').strip()
            titulo_resumido = norma.get('titulo_resumido', '').strip()
            
            if not texto_resumido and not titulo_resumido:
                logger.debug(f"Filtering out norma {norma['infoleg_id']}: No substantive content")
                continue
            
            # Skip very short content (likely procedural)
            content_length = len(texto_resumido) + len(titulo_resumido)
            if content_length < 50:  # Minimum content threshold
                logger.debug(f"Filtering out norma {norma['infoleg_id']}: Content too short ({content_length} chars)")
                continue
            
            filtered_normas.append(norma)
        
        logger.info(f"Filtered to {len(filtered_normas)} relevant normas")
        return filtered_normas
    
    def _apply_processing_limits(self, normas: List[Dict[str, Any]], max_total: int = 15) -> List[Dict[str, Any]]:
        """
        Apply processing limits to reduce API costs:
        - No limit on Leyes and Decretos (always process all)
        - Apply limit on other types (Resoluciones, Disposiciones, etc.)
        - Total limit is max_total normas
        """
        logger.info(f"Applying processing limits with max_total={max_total}")
        
        # Separate normas by importance
        high_priority = []  # Leyes and Decretos
        other_normas = []   # Everything else
        
        for norma in normas:
            tipo_norma = norma.get('tipo_norma', '').strip()
            if tipo_norma in ['Ley', 'Decreto']:
                high_priority.append(norma)
            else:
                other_normas.append(norma)
        
        logger.info(f"Found {len(high_priority)} high-priority normas (Leyes/Decretos)")
        logger.info(f"Found {len(other_normas)} other normas")
        
        # Always include all high-priority normas
        result = high_priority.copy()
        
        # Calculate remaining slots for other normas
        remaining_slots = max_total - len(high_priority)
        
        if remaining_slots > 0 and other_normas:
            # Sort other normas by our priority system (same as ranking logic)
            other_normas_sorted = sorted(
                other_normas,
                key=lambda x: self.NORMA_TYPE_PRIORITY.get(x.get('tipo_norma', ''), 999)
            )
            
            # Take only the remaining slots
            selected_others = other_normas_sorted[:remaining_slots]
            result.extend(selected_others)
            
            logger.info(f"Selected {len(selected_others)} additional normas (limit: {remaining_slots})")
        elif remaining_slots <= 0:
            logger.info(f"High-priority normas ({len(high_priority)}) exceed limit ({max_total}), processing all anyway")
        
        logger.info(f"Final selection: {len(result)} normas for processing")
        return result
    
    async def _wait_for_rate_limit(self):
        """Smart rate limiting to avoid hitting API limits."""
        current_time = time.time()
        
        # Reset window if it's been more than a minute
        if current_time - self.rate_limit_window_start > 60:
            self.request_count = 0
            self.rate_limit_window_start = current_time
        
        # If we're approaching the limit, wait
        if self.request_count >= self.max_requests_per_minute:
            wait_time = 60 - (current_time - self.rate_limit_window_start)
            if wait_time > 0:
                logger.info(f"Rate limit approaching, waiting {wait_time:.1f} seconds...")
                await asyncio.sleep(wait_time)
                # Reset after waiting
                self.request_count = 0
                self.rate_limit_window_start = time.time()
        else:
            # Smart spacing between requests
            time_since_last = current_time - self.rate_limit_window_start
            expected_time = self.request_count * self.request_interval
            if time_since_last < expected_time:
                wait_time = expected_time - time_since_last
                logger.debug(f"Spacing requests: waiting {wait_time:.1f} seconds")
                await asyncio.sleep(wait_time)
        
        self.request_count += 1
    
    async def _generate_norma_summary_with_analysis(self, norma: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate summary with analysis for a single norma using LLM.
        Returns JSON with resumen, puntaje_impacto, and tema_editorial.
        """
        logger.debug(f"Generating analysis for norma {norma['infoleg_id']}")
        
        # Create prompt for LLM analysis
        system_prompt = """Sos un asistente legal especializado en derecho argentino. 
            Tu tarea es analizar normas legales y generar:
            1. Un resumen conciso y profesional
            2. Una evaluación de su impacto
            3. Una clasificación temática

            Debés responder ÚNICAMENTE en formato JSON válido, sin texto adicional."""
        
        prompt = f"""Analizá la siguiente norma legal argentina y respondé en formato JSON con esta estructura exacta:
            {{
            "resumen": "tu resumen aquí (80-150 palabras)",
            "puntaje_impacto": número del 1 al 10,
            "tema_editorial": "nombre del tema"
            }}

            **TEMAS EDITORIALES DISPONIBLES** (elegí el que mejor corresponda):
            - "Economía y Finanzas" (tributario, comercial, financiero, inversiones, AFIP, BCRA)
            - "Trabajo y Empleo" (derecho laboral, sindical, seguridad social, relaciones laborales)
            - "Salud Pública" (salud, medicamentos, sanidad, obras sociales, hospitales)
            - "Educación" (educación, universidades, becas, escuelas)
            - "Infraestructura y Servicios" (obras públicas, transporte, vivienda, energía)
            - "Seguridad y Justicia" (penal, seguridad, fuerzas armadas, policía, justicia)
            - "Ambiente y Recursos" (ambiental, minería, agricultura, pesca, parques)
            - "Administración Pública" (regulaciones internas del estado, procedimientos administrativos)
            - "Comercio Exterior" (aduanas, importación, exportación, aranceles)
            - "Tecnología y Comunicaciones" (telecomunicaciones, tecnología, datos personales)
            - "Cultura y Deportes" (cultura, patrimonio, deportes, turismo)

            **DATOS DE LA NORMA:**
            Tipo de norma: {norma.get('tipo_norma', 'N/A')}
            Clase de norma: {norma.get('clase_norma', 'N/A')}
            Dependencia: {norma.get('dependencia', 'N/A')}
            Titulo Resumido: {norma.get('titulo_resumido', 'N/A')}
            Título sumario: {norma.get('titulo_sumario', 'N/A')}

            Contenido:
            Texto Resumido: {norma.get('texto_resumido', 'N/A')}
            Texto Norma: {norma.get('texto_norma', 'N/A')}

            **INSTRUCCIONES:**

            1. **Resumen**: Capturá la esencia de la norma destacando:
            - Qué establece o modifica
            - A quiénes afecta
            - Cuál es el cambio o novedad principal
            - Usa lenguaje profesional pero accesible

            2. **Impact Score (1-10)**: Evaluá considerando:
            - Alcance: ¿A cuántas personas/empresas/instituciones afecta?
                * 1-3: Norma técnica, alcance muy limitado o ajuste menor
                * 4-6: Afecta a un sector específico, cambio procedural o moderado
                * 7-8: Impacto significativo en un sector amplio o múltiples sectores
                * 9-10: Cambio estructural, afecta masivamente la población o economía
            - Novedad: ¿Es cambio sustancial o ajuste de norma existente?
            - Urgencia: ¿Requiere acción inmediata de los afectados?

            3. **Tema Editorial**: Elegí UNO de los temas listados arriba. Para decidir:
            - Mirá primero el CONTENIDO de la norma (qué regula)
            - Usá como ayuda la DEPENDENCIA (organismo emisor)
            - Usá como ayuda el TÍTULO SUMARIO
            - Si la norma toca múltiples temas, elegí el más prominente

            Respondé SOLO con el JSON, sin texto antes ni después."""
        
        try:
            # Smart rate limiting before each request
            await self._wait_for_rate_limit()
            
            # Check content length to avoid overly long prompts
            content_length = len(prompt)
            if content_length > 15000:  # Reasonable limit for prompt length
                logger.warning(f"Very long prompt for norma {norma['infoleg_id']}: {content_length} chars, truncating content")
                # Truncate the norma content if too long
                texto_resumido = norma.get('texto_resumido', '')[:1000] + "..." if len(norma.get('texto_resumido', '')) > 1000 else norma.get('texto_resumido', '')
                texto_norma = norma.get('texto_norma', '')[:1000] + "..." if len(norma.get('texto_norma', '')) > 1000 else norma.get('texto_norma', '')
                
                # Rebuild prompt with truncated content
                prompt = f"""Analizá la siguiente norma legal argentina y respondé en formato JSON con esta estructura exacta:
            {{
            "resumen": "tu resumen aquí (80-150 palabras)",
            "puntaje_impacto": número del 1 al 10,
            "tema_editorial": "nombre del tema"
            }}

            **TEMAS EDITORIALES DISPONIBLES** (elegí el que mejor corresponda):
            - "Economía y Finanzas" (tributario, comercial, financiero, inversiones, AFIP, BCRA)
            - "Trabajo y Empleo" (derecho laboral, sindical, seguridad social, relaciones laborales)
            - "Salud Pública" (salud, medicamentos, sanidad, obras sociales, hospitales)
            - "Educación" (educación, universidades, becas, escuelas)
            - "Infraestructura y Servicios" (obras públicas, transporte, vivienda, energía)
            - "Seguridad y Justicia" (penal, seguridad, fuerzas armadas, policía, justicia)
            - "Ambiente y Recursos" (ambiental, minería, agricultura, pesca, parques)
            - "Administración Pública" (regulaciones internas del estado, procedimientos administrativos)
            - "Comercio Exterior" (aduanas, importación, exportación, aranceles)
            - "Tecnología y Comunicaciones" (telecomunicaciones, tecnología, datos personales)
            - "Cultura y Deportes" (cultura, patrimonio, deportes, turismo)

            **DATOS DE LA NORMA:**
            Tipo de norma: {norma.get('tipo_norma', 'N/A')}
            Clase de norma: {norma.get('clase_norma', 'N/A')}
            Dependencia: {norma.get('dependencia', 'N/A')}
            Titulo Resumido: {norma.get('titulo_resumido', 'N/A')}
            Título sumario: {norma.get('titulo_sumario', 'N/A')}

            Contenido:
            Texto Resumido: {texto_resumido}
            Texto Norma: {texto_norma}

            **INSTRUCCIONES:**

            1. **Resumen**: Capturá la esencia de la norma destacando:
            - Qué establece o modifica
            - A quiénes afecta
            - Cuál es el cambio o novedad principal
            - Usa lenguaje profesional pero accesible

            2. **Impact Score (1-10)**: Evaluá considerando:
            - Alcance: ¿A cuántas personas/empresas/instituciones afecta?
                * 1-3: Norma técnica, alcance muy limitado o ajuste menor
                * 4-6: Afecta a un sector específico, cambio procedural o moderado
                * 7-8: Impacto significativo en un sector amplio o múltiples sectores
                * 9-10: Cambio estructural, afecta masivamente la población o economía
            - Novedad: ¿Es cambio sustancial o ajuste de norma existente?
            - Urgencia: ¿Requiere acción inmediata de los afectados?

            3. **Tema Editorial**: Elegí UNO de los temas listados arriba. Para decidir:
            - Mirá primero el CONTENIDO de la norma (qué regula)
            - Usá como ayuda la DEPENDENCIA (organismo emisor)
            - Usá como ayuda el TÍTULO SUMARIO
            - Si la norma toca múltiples temas, elegí el más prominente

            Respondé SOLO con el JSON, sin texto antes ni después."""
            
            messages = [
                Message(role="user", content=prompt)
            ]
            
            # Collect response from stream
            response_chunks = []
            chunk_count = 0
            async for chunk in self.ai_service.generate_stream(messages, system_prompt):
                response_chunks.append(chunk)
                chunk_count += 1
                if chunk_count % 5 == 0:  # Log every 5 chunks
                    logger.debug(f"Received {chunk_count} chunks for norma {norma['infoleg_id']}")
            
            response = "".join(response_chunks)
            logger.debug(f"Total chunks received: {chunk_count}, response length: {len(response)}")
            
            logger.debug(f"Raw LLM response for norma {norma['infoleg_id']}: {response[:200]}...")
            
            # Parse JSON response
            try:
                if not response.strip():
                    raise ValueError("Empty response from LLM")
                
                # Clean up response - remove markdown code blocks if present
                cleaned_response = response.strip()
                if cleaned_response.startswith('```json'):
                    cleaned_response = cleaned_response[7:]  # Remove ```json
                if cleaned_response.endswith('```'):
                    cleaned_response = cleaned_response[:-3]  # Remove ```
                cleaned_response = cleaned_response.strip()
                
                analysis = json.loads(cleaned_response)
                
                # Validate required fields
                required_fields = ['resumen', 'puntaje_impacto', 'tema_editorial']
                if not all(field in analysis for field in required_fields):
                    raise ValueError(f"Missing required fields in LLM response")
                
                # Validate impact score
                if not isinstance(analysis['puntaje_impacto'], int) or not (1 <= analysis['puntaje_impacto'] <= 10):
                    raise ValueError(f"Invalid impact score: {analysis['puntaje_impacto']}")
                
                # Validate theme
                if analysis['tema_editorial'] not in self.EDITORIAL_THEMES:
                    logger.warning(f"Unknown theme '{analysis['tema_editorial']}', defaulting to 'Economía y Finanzas'")
                    analysis['tema_editorial'] = "Economía y Finanzas"
                
                logger.debug(f"Generated analysis for norma {norma['infoleg_id']}: impact={analysis['puntaje_impacto']}, theme={analysis['tema_editorial']}")
                return analysis
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM JSON response for norma {norma['infoleg_id']}: {e}")
                logger.error(f"Raw response was: {response}")
                # Fallback analysis
                return {
                    "resumen": f"Resumen no disponible para la norma {norma['infoleg_id']}.",
                    "puntaje_impacto": 5,
                    "tema_editorial": "Economía y Finanzas"
                }
                
        except Exception as e:
            logger.error(f"Error generating analysis for norma {norma['infoleg_id']}: {e}")
            # Fallback analysis
            return {
                "resumen": f"Error al generar resumen para la norma {norma['infoleg_id']}.",
                "puntaje_impacto": 5,
                "tema_editorial": "Economía y Finanzas"
            }
    
    def _calculate_norma_priority(self, norma: Dict[str, Any], analysis: Dict[str, Any]) -> Tuple[int, int]:
        """
        Calculate priority for norma ranking.
        Returns (type_priority, impact_score) for sorting.
        """
        tipo_norma = norma.get('tipo_norma', '').strip()
        clase_norma = norma.get('clase_norma', '').strip()
        impact_score = analysis.get('puntaje_impacto', 5)
        
        # Get base priority from type
        type_priority = self.NORMA_TYPE_PRIORITY.get(tipo_norma, 999)
        
        # Promote Decreto to highest priority if it's a DNU
        if tipo_norma == "Decreto" and clase_norma == "DNU":
            type_priority = 1
        
        # Return tuple for sorting (lower numbers = higher priority)
        # Negative impact score so higher scores come first
        return (type_priority, -impact_score)
    
    def _rank_normas(self, analyzed_normas: List[Tuple[Dict[str, Any], Dict[str, Any]]]) -> List[Tuple[Dict[str, Any], Dict[str, Any]]]:
        """
        Rank normas by priority (type hierarchy, then impact score).
        Returns sorted list of (norma, analysis) tuples.
        """
        logger.info(f"Ranking {len(analyzed_normas)} analyzed normas")
        
        # Sort by priority
        ranked_normas = sorted(
            analyzed_normas,
            key=lambda x: self._calculate_norma_priority(x[0], x[1])
        )
        
        # Log ranking summary
        for i, (norma, analysis) in enumerate(ranked_normas[:5]):  # Top 5
            logger.info(f"Rank {i+1}: {norma['tipo_norma']} (ID: {norma['infoleg_id']}, Impact: {analysis['puntaje_impacto']}, Theme: {analysis['tema_editorial']})")
        
        return ranked_normas
    
    async def _generate_hero_section(self, norma: Dict[str, Any], analysis: Dict[str, Any]) -> str:
        """Generate hero section content for the most important norma."""
        logger.info(f"Generating hero section for norma {norma['infoleg_id']}")
        
        # Prompt
        system_prompt = """Sos el editor principal de un boletín normativo profesional argentino.
            Tu tarea es crear contenido periodístico atractivo pero riguroso para el destacado principal del día.
            Debés responder ÚNICAMENTE en formato JSON válido."""

        prompt = f"""Esta es la norma de MAYOR IMPACTO del día. Creá contenido editorial para el destacado principal del boletín.
            **NORMA:**
            Tipo: {norma.get('tipo_norma')}
            Título: {norma.get('titulo_resumido', '')}
            Dependencia: {norma.get('dependencia', 'N/A')}

            Análisis:
            Resumen de norma: {analysis['resumen']}
            Impacto: {analysis['puntaje_impacto']}/10
            Tema: {analysis['tema_editorial']}

            **INSTRUCCIONES:**

            Generá un JSON con esta estructura:

            {{
            "titular": "tu titular aquí",
            "lead": "tu lead aquí"
            }}

            1. **Titular** (10-15 palabras):
            - Debe capturar la ESENCIA del cambio o novedad
            - Usar lenguaje directo y activo
            - Evitar jerga excesiva pero mantener precisión
            - Ejemplo: "Nuevo régimen tributario beneficiará a 50.000 PyMEs"
            - NO usar: "Se establece modificación al artículo 123..."

            2. **Lead** (40-60 palabras, 2-3 oraciones):
            - Expandir el titular con contexto clave
            - Responder: ¿Qué cambia? ¿A quién afecta? ¿Cuándo entra en vigencia (si está en el resumen)?
            - Mantener tono periodístico pero técnico
            - Mencionar explícitamente el tipo y número de norma

            Respondé SOLO con el JSON, sin texto adicional."""
        
        try:
            await self._wait_for_rate_limit()
            
            messages = [
                Message(role="user", content=prompt)
            ]
            
            # Collect response from stream
            response_chunks = []
            async for chunk in self.ai_service.generate_stream(messages, system_prompt):
                response_chunks.append(chunk)
            response = "".join(response_chunks)
            
            # Parse JSON response for hero section
            try:
                # Clean up response - remove markdown code blocks if present
                cleaned_response = response.strip()
                if cleaned_response.startswith('```json'):
                    cleaned_response = cleaned_response[7:]  # Remove ```json
                if cleaned_response.endswith('```'):
                    cleaned_response = cleaned_response[:-3]  # Remove ```
                cleaned_response = cleaned_response.strip()
                
                hero_json = json.loads(cleaned_response)
                
                # Validate required fields
                if not all(field in hero_json for field in ['titular', 'lead']):
                    raise ValueError("Missing required fields in hero section response")
                
                return json.dumps(hero_json, ensure_ascii=False)
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse hero section JSON response: {e}")
                # Fallback to plain text if JSON parsing fails
                return response.strip()
                
        except Exception as e:
            logger.error(f"Error generating hero section: {e}")
            fallback_json = {
                "titular": f"Error en norma {norma['infoleg_id']}",
                "lead": "Error al generar contenido para la sección principal."
            }
            return json.dumps(fallback_json, ensure_ascii=False)
    
    async def _generate_secondary_section(self, normas_with_analysis: List[Tuple[Dict[str, Any], Dict[str, Any]]]) -> str:
        """Generate secondary section content for the next 2-3 most important normas."""
        logger.info(f"Generating secondary section for {len(normas_with_analysis)} normas")
        
        # Prepare normas info for prompt
        normas_info = []
        for norma, analysis in normas_with_analysis:
            normas_info.append({
                "tipo": norma.get('tipo_norma'),
                "numero": norma.get('numero_ref', 'N/A'),
                "titulo": norma.get('titulo_resumido', ''),
                "dependencia": norma.get('dependencia', 'N/A'),
                "resumen": analysis['resumen'],
                "impacto": analysis['puntaje_impacto']
            })
        
        # Prompt
        system_prompt = """Sos editor de un boletín normativo profesional argentino.
            Creá contenido conciso para destacados secundarios (noticias breves pero importantes).
            Debés responder ÚNICAMENTE en formato JSON válido."""

        prompt = f"""Estas son las normas DESTACADAS SECUNDARIAS del día (las siguientes más importantes después del destacado principal).
            Para cada una, generá un titular breve y un resumen ultra-conciso.

            {json.dumps(normas_info, ensure_ascii=False, indent=2)}

            **INSTRUCCIONES:**

            Respondé con un JSON que sea un array de objetos:

            [
            {{
                "titular": "titular norma 1 (8-12 palabras)",
                "resumen_corto": "resumen ultra-conciso (25-35 palabras)",
            }},
            {{
                "titular": "titular norma 2",
                "resumen_corto": "resumen ultra-conciso"
            }},
            ]

            **Características:**

            - **Titular**: directo al punto
            - **Resumen corto**: Solo LA idea principal (25-35 palabras, 1-2 oraciones máximo)

            Respondé SOLO con el JSON array, sin texto adicional."""
        
        try:
            await self._wait_for_rate_limit()
            
            messages = [
                Message(role="user", content=prompt)
            ]
            
            # Collect response from stream
            response_chunks = []
            async for chunk in self.ai_service.generate_stream(messages, system_prompt):
                response_chunks.append(chunk)
            response = "".join(response_chunks)
            
            # Parse JSON response for secondary section
            try:
                # Clean up response - remove markdown code blocks if present
                cleaned_response = response.strip()
                if cleaned_response.startswith('```json'):
                    cleaned_response = cleaned_response[7:]  # Remove ```json
                if cleaned_response.endswith('```'):
                    cleaned_response = cleaned_response[:-3]  # Remove ```
                cleaned_response = cleaned_response.strip()
                
                secondary_json = json.loads(cleaned_response)
                
                # Validate it's a list
                if not isinstance(secondary_json, list):
                    raise ValueError("Secondary section response should be a JSON array")
                
                # Validate each item has required fields
                for item in secondary_json:
                    if not all(field in item for field in ['titular', 'resumen_corto']):
                        raise ValueError("Missing required fields in secondary section item")
                
                return json.dumps(secondary_json, ensure_ascii=False)
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse secondary section JSON response: {e}")
                # Fallback to plain text if JSON parsing fails
                return response.strip()
                
        except Exception as e:
            logger.error(f"Error generating secondary section: {e}")
            fallback_json = [
                {
                    "titular": "Error en sección secundaria",
                    "resumen_corto": "Error al generar contenido para normas secundarias."
                }
            ]
            return json.dumps(fallback_json, ensure_ascii=False)
    
    async def _generate_theme_section(self, theme: str, normas_with_analysis: List[Tuple[Dict[str, Any], Dict[str, Any]]]) -> str:
        """Generate thematic section content for normas grouped by editorial theme."""
        logger.info(f"Generating theme section '{theme}' for {len(normas_with_analysis)} normas")
        
        # Prepare normas info for prompt
        normas_info = []
        for norma, analysis in normas_with_analysis:
            normas_info.append({
                "tipo": norma.get('tipo_norma'),
                "titulo": norma.get('titulo_resumido', ''),
                "dependencia": norma.get('dependencia', 'N/A'),
                "resumen": analysis['resumen'],
                "impacto": analysis['puntaje_impacto']
            })

        prompt = f"""
            Eres el editor de un boletín normativo profesional.
            
            Escribe un párrafo editorial (50-80 palabras) que sintetice las principales novedades 
            normativas para la sección temática "{theme}" publicadas hoy.
            
            Normas en esta categoría:
            {json.dumps(normas_info, ensure_ascii=False, indent=2)}
            
            El párrafo debe:
            - Identificar el hilo conductor entre las normas (si existe)
            - Mencionar las más relevantes por nombre (ej: "Decreto 123/2025")
            - Usar tono periodístico pero técnico
            - NO inventar información que no esté en los summaries
            
            Responde solo con el párrafo, sin introducción. 
            """
        
        try:
            await self._wait_for_rate_limit()
            
            messages = [Message(role="user", content=prompt)]
            
            # Collect response from stream
            response_chunks = []
            async for chunk in self.ai_service.generate_stream(messages, ""):
                response_chunks.append(chunk)
            response = "".join(response_chunks)
            # Theme section returns plain text (paragraph), not JSON
            return response.strip()
        except Exception as e:
            logger.error(f"Error generating theme section for {theme}: {e}")
            return f"Error al generar sección temática {theme}."
    
    async def generate_daily_newspaper_digest(self, db: Session, target_date: date = None) -> Dict[str, Any]:
        """
        Generate complete newspaper-style daily digest.
        
        Process:
        1. Fetch and filter normas for the target date
        2. Generate analysis (summary, impact, theme) for each norma
        3. Rank normas by priority (type hierarchy + impact score)
        4. Generate hero section (top norma)
        5. Generate secondary section (next 2-3 normas)
        6. Generate thematic sections (remaining normas grouped by theme)
        7. Store all sections in database
        """
        if target_date is None:
            target_date = date.today()
        
        logger.info(f"Starting newspaper digest generation for {target_date}")
        
        # Clean up old norma analyses (but keep digest sections for historical view)
        previous_date = target_date - timedelta(days=1)
        try:
            deleted_count = db.query(NormaSummaryAnalysis).filter(
                NormaSummaryAnalysis.summary_date < target_date
            ).delete()
            if deleted_count > 0:
                logger.info(f"Cleaned up {deleted_count} old norma analyses from before {target_date}")
            db.commit()
        except Exception as e:
            logger.warning(f"Failed to clean up old norma analyses: {e}")
            db.rollback()
        
        # Check if digest already exists for this date
        existing_count = db.query(DailyDigestNewspaper).filter(
            DailyDigestNewspaper.digest_date == target_date
        ).count()
        
        if existing_count > 0:
            logger.info(f"Found {existing_count} existing digest sections for {target_date}, skipping generation")
            return {
                "success": True,
                "message": f"Newspaper digest already exists for {target_date}",
                "date": target_date,
                "sections_generated": existing_count
            }
        
        try:
            # Step 1: Fetch and filter normas
            normas = self._fetch_daily_normas(target_date)
            filtered_normas = self._filter_normas_for_newspaper(normas)
            
            if not filtered_normas:
                logger.info(f"No relevant normas found for newspaper digest on {target_date}")
                return {
                    "success": True,
                    "message": f"No relevant normas found for {target_date}",
                    "date": target_date,
                    "sections_generated": 0
                }
            
            # Apply processing limits to reduce API costs
            limited_normas = self._apply_processing_limits(filtered_normas)
            
            # Step 2: Generate analysis for each norma
            logger.info(f"Generating analysis for {len(limited_normas)} normas")
            analyzed_normas = []
            
            for norma in limited_normas:
                analysis = await self._generate_norma_summary_with_analysis(norma)
                analyzed_normas.append((norma, analysis))
                
                # Prepare norma data for JSON storage (convert dates to strings)
                norma_data_for_json = norma.copy()
                for key, value in norma_data_for_json.items():
                    if isinstance(value, date):
                        norma_data_for_json[key] = value.isoformat()
                    elif isinstance(value, datetime):
                        norma_data_for_json[key] = value.isoformat()
                
                # Store individual analysis in database
                norma_analysis = NormaSummaryAnalysis(
                    infoleg_id=norma['infoleg_id'],
                    summary_date=target_date,
                    resumen=analysis['resumen'],
                    puntaje_impacto=analysis['puntaje_impacto'],
                    tema_editorial=analysis['tema_editorial'],
                    tipo_norma=norma.get('tipo_norma', ''),
                    clase_norma=norma.get('clase_norma', ''),
                    titulo_sumario=norma.get('titulo_sumario', ''),
                    dependencia=norma.get('dependencia', ''),
                    raw_norma_data=norma_data_for_json
                )
                db.add(norma_analysis)
            
            db.commit()
            logger.info(f"Stored {len(analyzed_normas)} norma analyses")
            
            # Step 3: Rank normas by priority
            ranked_normas = self._rank_normas(analyzed_normas)
            
            sections_generated = 0
            
            # Step 4: Generate hero section (top norma)
            if ranked_normas:
                hero_norma, hero_analysis = ranked_normas[0]
                hero_content = await self._generate_hero_section(hero_norma, hero_analysis)
                
                hero_section = DailyDigestNewspaper(
                    digest_date=target_date,
                    section_type="hero",
                    section_content=hero_content,
                    norma_ids=[hero_norma['infoleg_id']],
                    section_order=1
                )
                db.add(hero_section)
                sections_generated += 1
                logger.info(f"Generated hero section for norma {hero_norma['infoleg_id']}")
            
            # Step 5: Generate secondary section (next 2-3 normas)
            if len(ranked_normas) > 1:
                secondary_normas = ranked_normas[1:4]  # Take next 2-3 normas
                secondary_content = await self._generate_secondary_section(secondary_normas)
                
                secondary_section = DailyDigestNewspaper(
                    digest_date=target_date,
                    section_type="secondary",
                    section_content=secondary_content,
                    norma_ids=[norma['infoleg_id'] for norma, _ in secondary_normas],
                    section_order=2
                )
                db.add(secondary_section)
                sections_generated += 1
                logger.info(f"Generated secondary section for {len(secondary_normas)} normas")
            
            # Step 6: Generate thematic sections
            # Get remaining normas (after hero and secondary)
            remaining_normas = ranked_normas[4:] if len(ranked_normas) > 4 else []
            
            if remaining_normas:
                # Group by theme
                theme_groups = {}
                for norma, analysis in remaining_normas:
                    theme = analysis['tema_editorial']
                    if theme not in theme_groups:
                        theme_groups[theme] = []
                    theme_groups[theme].append((norma, analysis))
                
                # Generate section for each theme
                section_order = 3
                for theme, theme_normas in theme_groups.items():
                    theme_content = await self._generate_theme_section(theme, theme_normas)
                    
                    theme_section = DailyDigestNewspaper(
                        digest_date=target_date,
                        section_type=theme,
                        section_content=theme_content,
                        norma_ids=[norma['infoleg_id'] for norma, _ in theme_normas],
                        section_order=section_order
                    )
                    db.add(theme_section)
                    sections_generated += 1
                    section_order += 1
                    logger.info(f"Generated theme section '{theme}' for {len(theme_normas)} normas")
            
            # Commit all sections
            db.commit()
            
            logger.info(f"Successfully generated newspaper digest for {target_date}: {sections_generated} sections")
            return {
                "success": True,
                "message": f"Generated newspaper digest for {target_date}",
                "date": target_date,
                "normas_analyzed": len(analyzed_normas),
                "sections_generated": sections_generated
            }
            
        except Exception as e:
            logger.error(f"Error generating newspaper digest: {str(e)}")
            db.rollback()
            raise

    # Keep existing methods for backward compatibility (you can remove these later)
    def get_available_organisms(self, db: Session) -> Dict[str, Any]:
        """Get available organisms for digest preferences (legacy method)."""
        # This can return empty or maintain old functionality
        return {"organisms": []}
    
    def get_user_preferences(self, db: Session, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user digest preferences (legacy method)."""
        # This can return None or maintain old functionality
        return None
    
    def update_user_preferences(self, db: Session, user_id: str, preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Update user digest preferences (legacy method)."""
        # This can return empty or maintain old functionality
        return {"success": True}
    
    def get_user_daily_digest(self, db: Session, user_id: str, target_date: date) -> Dict[str, Any]:
        """Get user's daily digest (legacy method)."""
        # This can return the newspaper digest or maintain old functionality
        return {"success": True, "date": target_date}