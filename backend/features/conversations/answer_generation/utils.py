from core.clients.embedding import get_embedding
from core.clients.vectorial import search_vectors
from core.clients.relational import fetch_batch_entities

import json
from fastapi import HTTPException

from core.utils.logging_config import get_logger
logger = get_logger(__name__)

def fetch_and_parse_legal_context(user_question: str) -> tuple[list, list]:
    """
    Fetch relevant legal context based on user question.

    Returns:
        Tuple of (normas_data, norma_ids)
    """
    # Generate embedding for user question
    embedding_result = get_embedding(user_question)

    if not embedding_result["success"] or not embedding_result["data"]:
        raise HTTPException(status_code=500, detail="Failed to generate embedding")

    embedding_vector = embedding_result["data"].get("embedding", [])

    # Search for similar vectors
    search_results = search_vectors(
        embedding=embedding_vector,
        filters={},
        limit=5
    )

    # Log individual search results structure
    for i, result in enumerate(search_results.get("results", [])):
        logger.info(f"Search result {i}: {result}")

    # Extract unique norma IDs from search results
    norma_ids = _extract_norma_ids_from_search_results(search_results.get("results", []))
    logger.info(f"Extracted norma IDs: {norma_ids}")

    # Fetch batch entities from relational microservice
    batch_result = fetch_batch_entities(search_results.get("results", []))

    # Parse normas
    normas_json_str = batch_result["normas_json"]
    try:
        normas_data = json.loads(normas_json_str)
        logger.info("Normas JSON:\n%s", json.dumps(normas_data, indent=2, ensure_ascii=False))
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse normas_json: {e}")
        logger.info(f"Raw normas_json string: {normas_json_str}")
        normas_data = []

    return normas_data, norma_ids


def _extract_norma_ids_from_search_results(search_results: list) -> list:
    """
    Extract unique norma IDs from vector search results.
    
    Args:
        search_results: List of search result dicts with 'metadata' containing 'source_id'
        
    Returns:
        List of unique norma IDs (integers)
    """
    norma_ids = set()  # Set automatically handles duplicates
    
    for result in search_results:
        metadata = result.get("metadata", {})
        source_id = metadata.get("source_id")
        
        if source_id is not None:
            try:
                norma_id = int(source_id)
                norma_ids.add(norma_id)
            except (ValueError, TypeError) as e:
                logger.warning(f"Could not convert source_id '{source_id}' to int: {e}")
                continue
    
    return list(norma_ids)


def build_enhanced_prompt(user_question: str, normas_data: list, tone: str = "default") -> str:
    """Build an enhanced prompt with legal context for the AI."""
    prompt = f"""
    Eres un asistente experto en derecho y normativa argentina. 
    Tu tarea es responder con precisión, claridad y neutralidad a consultas sobre leyes, decretos, disposiciones y reglamentaciones de la República Argentina.

    Dispones de información proveniente de normas jurídicas que pueden contener fragmentos relevantes para la consulta.
    Usa esa información como fuente exclusiva de conocimiento, haciendo referencia a la norma **SOLO UTILIZANDO LA INFORMACION PROVISTA** en las normas relevantes.
    Por ejemplo: "según el Decreto que trata acerca de Símbolos patrios (título_sumario) publicado en ...".

    Si un fragmento menciona leyes, decretos, artículos o normas específicas, **puedes citarlos naturalmente en tu respuesta**
    (por ejemplo: "según la Ley 14.346…" o "el Decreto 10.302/1944 establece…").
    Si la información no aparece en los textos, puedes complementar con conocimiento general y verificado,
    siempre que sea factual, seguro y relacionado con Argentina.

    Reglas generales:
    - No digas que te fueron proporcionados "documentos", "contexto" o "fragmentos".
    - Sí puedes citar leyes, artículos o decretos si aparecen o son relevantes.
    - No inventes normas ni cites leyes inexistentes.
    - Si no existe una norma aplicable, acláralo con naturalidad ("no hay una ley específica que regule este tema").
    - Si la pregunta no es jurídica, respóndela brevemente con información verificada, de manera respetuosa y neutral.
    - Evita opiniones políticas, ideológicas o personales.
    - No especules sobre hechos, personas o instituciones.
    - Usa un tono institucional pero claro, como el de un asistente público informativo.

    ### Instrucciones sobre el tono de la respuesta:
    Tienes tres niveles de referencia para definir tu tono, con prioridad jerárquica:

    1. **Tono seleccionado por el usuario (mayor prioridad):**
    El usuario ha seleccionado este tono: "{tone}".
    Adopta el estilo de respuesta correspondiente a esa opción:

    - "formal": estilo técnico y jurídico, vocabulario profesional.
    - "academico": estilo explicativo y pedagógico, con contexto doctrinal o histórico.
    - "conciso": respuestas breves y directas, sin elaboraciones innecesarias.
    - "default": estilo equilibrado e informativo (si no se indica otro).

    2. **Instrucciones explícitas del usuario:**
    Si el usuario pidió explícitamente un estilo o modo particular de respuesta
    (por ejemplo, "explícamelo como si fuese un profesor" o "háblame de manera simple"),
    considera esas indicaciones, **a menos que contradigan el tono elegido en el punto 1.**

    3. **Adaptación al tono del usuario (menor prioridad):**
    Si el tono elegido es "default" y el usuario no dio instrucciones explícitas,
    adapta tu respuesta al nivel de formalidad o informalidad del usuario:
    - Si el usuario se expresa formalmente, responde con el mismo nivel técnico.
    - Si se expresa de manera simple o coloquial, responde en un tono accesible.
    En todos los casos, mantén respeto, precisión y corrección lingüística.

    ### Instrucciones sobre el seguimiento conversacional:
    Al finalizar tu respuesta, **cuando sea naturalmente apropiado**, ofrece al usuario una opción de continuidad que agregue valor:
    - Si mencionaste una norma general, ofrece profundizar en artículos específicos o casos de aplicación.
    - Si la respuesta fue amplia, ofrece aclarar algún punto en particular.
    - Si hay aspectos relacionados (procedimientos, requisitos, excepciones), menciona que puedes explicarlos.
    - Si existe normativa complementaria o reglamentaria relevante, ofrece consultarla.

    **Criterios para incluir o no el seguimiento:**
    - **Incluirlo** si la consulta tiene ramificaciones naturales, aspectos prácticos pendientes, o si solo respondiste parcialmente un tema complejo.
    - **No incluirlo** si la pregunta fue muy específica y ya está completamente respondida, o si es una consulta simple que no requiere profundización.
    - Adapta el estilo del seguimiento al tono seleccionado (formal, académico, conciso, etc.).

    **Ejemplos de seguimientos apropiados:**
    - "¿Te gustaría que profundice en los requisitos procedimentales establecidos en la reglamentación de esta ley?"
    - "Si necesitas información sobre cómo se aplica esta norma en casos específicos, puedo ayudarte con eso."
    - "¿Hay algún artículo en particular de este decreto que quieras que explique con más detalle?"
    - "También puedo informarte sobre las sanciones previstas por incumplimiento, si te es útil."

    El seguimiento debe ser **una única oración breve y natural**, no una lista de opciones.

    Pregunta del usuario:
    <pregunta_usuario>{user_question}</pregunta_usuario>

    Normas relevantes:
    <normas_relevantes>{json.dumps(normas_data, indent=2, ensure_ascii=False)}</normas_relevantes>

    Elabora la mejor respuesta posible cumpliendo las reglas anteriores.
    """

    logger.info(f"Enhanced prompt built for question: {user_question} with tone: {tone}")
    return prompt
