"""Client for embedding service API."""

import requests
from typing import Dict, Any


def get_embedding(text: str, embedding_url: str = "http://localhost:8001/embed") -> Dict[str, Any]:
    """
    Get text embedding from the embedding service.

    Args:
        text: The text to embed
        embedding_url: The embedding service URL (default: http://localhost:8001/embed)

    Returns:
        dict with the embedding response
    """
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
