"""Client for communicating with the vectorial microservice via REST API."""

import requests
from typing import List, Dict, Any, Optional
from core.config.config import settings


def search_vectors(
    embedding: List[float],
    filters: Optional[Dict[str, str]] = None,
    limit: int = 10,
    api_host: Optional[str] = None,
    api_port: Optional[int] = None
) -> Dict[str, Any]:
    """
    Search for similar vectors in the vectorial microservice via REST API.

    Args:
        embedding: The embedding vector to search with
        filters: Optional metadata filters
        limit: Maximum number of results to return (default: 10)
        api_host: The API server host (default: from settings.VECTORIAL_API_HOST)
        api_port: The API server port (default: from settings.VECTORIAL_API_PORT)

    Returns:
        dict with keys: success (bool), message (str), results (list)
    """
    host = api_host or settings.VECTORIAL_API_HOST
    port = api_port or settings.VECTORIAL_API_PORT
    url = f"http://{host}:{port}/api/v1/vectorial/search"

    # Build the request payload
    payload = {
        "embedding": embedding,
        "filters": filters if filters else {},
        "limit": limit
    }

    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()

        data = response.json()

        print(f"✓ Successfully performed vector search")
        print(f"Response message: {data.get('message', '')}")
        print(f"Found {len(data.get('results', []))} results")

        # Convert results to dict format
        results = []
        for result in data.get("results", []):
            results.append({
                "document_id": result.get("documentId"),
                "score": result.get("score"),
                "metadata": result.get("metadata", {})
            })
            print(f"  - Document: {result.get('documentId')}, Score: {result.get('score')}")

        return {
            "success": data.get("success", False),
            "message": data.get("message", ""),
            "results": results
        }
    except requests.exceptions.RequestException as e:
        print(f"✗ HTTP error during vector search: {str(e)}")
        return {
            "success": False,
            "message": f"HTTP error: {str(e)}",
            "results": []
        }
