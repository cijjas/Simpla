from core.clients.embedding import get_embedding
from core.clients.vectorial import search_vectors
from core.clients.relational import fetch_batch_entities

import json
from fastapi import HTTPException

from core.utils.logging_config import get_logger
logger = get_logger(__name__)

def fetch_and_parse_legal_context(user_question: str) -> tuple[list, list, list]:
    """
    Fetch relevant legal articles and divisions based on user question.

    Returns:
        Tuple of (articles_data, divisions_data, norma_ids)
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
    logger.info(f"Batch fetch result: {batch_result}")

    # Parse divisions
    divisions_json_str = batch_result["divisions_json"]
    try:
        divisions_data = json.loads(divisions_json_str)
        logger.info("Divisions JSON:\n%s", json.dumps(divisions_data, indent=2, ensure_ascii=False))
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse divisions_json: {e}")
        logger.info(f"Raw divisions_json string: {divisions_json_str}")
        divisions_data = []

    # Parse articles
    articles_json_str = batch_result["articles_json"]
    try:
        articles_data = json.loads(articles_json_str)
        logger.info("Articles JSON:\n%s", json.dumps(articles_data, indent=2, ensure_ascii=False))
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse articles_json: {e}")
        logger.info(f"Raw articles_json string: {articles_json_str}")
        articles_data = []

    return articles_data, divisions_data, norma_ids


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


def build_enhanced_prompt(user_question: str, articles_data: list, divisions_data: list) -> str:
    """Build an enhanced prompt with legal context for the AI."""
    prompt = f"""Pregunta del usuario: {user_question}

Contexto de artículos relevantes:
{json.dumps(articles_data, indent=2, ensure_ascii=False)}

Contexto de divisiones relevantes:
{json.dumps(divisions_data, indent=2, ensure_ascii=False)}

Por favor, responde la pregunta del usuario basándote en el contexto proporcionado de los artículos y divisiones legales."""

    logger.info(f"Enhanced prompt built for question: {user_question}")
    return prompt
