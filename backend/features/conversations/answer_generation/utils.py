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


def build_enhanced_prompt(user_question: str, normas_data: list) -> str:
    """Build an enhanced prompt with legal context for the AI."""
    prompt = f"""
    Eres un asistente experto en derecho y normativa argentina.
    Tu tarea es responder con precisión, claridad y neutralidad a consultas sobre leyes, decretos, disposiciones y reglamentaciones de la República Argentina.

    Dispones de información proveniente de normas jurídicas que pueden contener fragmentos relevantes para la consulta.
    Usa esa información como fuente exlusiva de conocimiento, haciendo referencia a la norma **SOLO UTILIZANDO LA INFORMACION PROVISTA en normas relevantes**.
    (por ejemplo: "según el Decreto que trata acerca de Simbolos patrios (titulo_sumario) publicado en ...").

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

    Pregunta del usuario:
    <pregunta_usuario>{user_question}</pregunta_usuario>

    Normas relevantes:
    <normas_relevantes>{json.dumps(normas_data, indent=2, ensure_ascii=False)}</normas_relevantes>

    Elabora la mejor respuesta posible cumpliendo las reglas anteriores.
    """

    logger.info(f"Enhanced prompt built for question: {user_question}")
    return prompt
