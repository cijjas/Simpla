"""Embedding service for generating text embeddings using HuggingFace."""

import logging
from typing import List
from huggingface_hub import InferenceClient
from core.config.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating text embeddings using HuggingFace API."""
    
    def __init__(self):
        """Initialize the embedding service."""
        if not settings.HF_API_KEY:
            raise ValueError("HuggingFace API key not configured")
        
        self.client = InferenceClient(token=settings.HF_API_KEY)
        self.model_name = 'intfloat/multilingual-e5-large'
    
    async def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for text using HuggingFace.
        
        Args:
            text: Input text to embed
            
        Returns:
            List of 1024 float values representing the embedding
            
        Raises:
            ValueError: If embedding generation fails or returns invalid dimensions
        """
        try:
            result = self.client.feature_extraction(
                model=self.model_name,
                text=f'query: {text}'
            )
            
            # Convert numpy array to list if needed
            if hasattr(result, 'tolist'):
                vector = result.tolist()
            else:
                vector = list(result)
            
            if not vector or len(vector) != 1024:
                raise ValueError(
                    f"Invalid embedding dimension: got {len(vector) if vector else 0}, expected 1024"
                )
            
            return vector
            
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise ValueError(f"Failed to generate embedding: {str(e)}")
    
    async def embed_query(self, query: str) -> List[float]:
        """
        Generate embedding for a search query.
        
        Args:
            query: Search query to embed
            
        Returns:
            List of 1024 float values representing the embedding
        """
        return await self.embed_text(query)
