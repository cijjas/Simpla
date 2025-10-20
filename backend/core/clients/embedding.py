"""Client for the embedding service API."""

import os
import requests
from typing import Dict, Any


def get_embedding(text: str, embedding_url: str = None) -> Dict[str, Any]:
    """
    Get text embedding from the embedding service.

    Args:
        text: The text to embed
        embedding_url: The embedding service URL (optional, defaults to EMBEDDER_API_HOST env var or http://localhost:8001/embed)

    Returns:
        dict with the embedding response
    """
    if embedding_url is None:
        embedder_host = os.getenv("EMBEDDER_API_HOST", "http://localhost:8001")
        embedding_url = f"{embedder_host}/embed"

    try:
        response = requests.post(
            embedding_url,
            json={"text": text},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        response.raise_for_status()

        result = response.json()
        print(f"✓ Successfully generated embedding for text: '{text[:50]}...'")
        # print(f"Embedding response: {result}")

        return {
            "success": True,
            "data": result
        }
    except requests.exceptions.RequestException as e:
        print(f"✗ Error calling embedding service: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "data": None
        }
