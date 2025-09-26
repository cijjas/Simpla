"""
Legacy utilities module - DEPRECATED.

This module is kept for backward compatibility but should not be used in new code.
Use the new services architecture instead:
- services.embedding_service.EmbeddingService
- services.pinecone_service.PineconeService  
- services.rag_service.RAGService

See config.py for configuration management.
"""

import warnings
from typing import List

# Import from new services
from services import RAGService
from config import settings

# Issue deprecation warning
warnings.warn(
    "routes.chat.utils is deprecated. Use services.* modules instead.",
    DeprecationWarning,
    stacklevel=2
)

# Legacy variables for backward compatibility
PROMPT_TEMPLATE = settings.PROMPT_TEMPLATE

# Legacy wrapper functions for backward compatibility
async def embed_text(text: str) -> List[float]:
    """Legacy wrapper - use EmbeddingService.embed_text instead."""
    warnings.warn("embed_text is deprecated. Use EmbeddingService.embed_text instead.", DeprecationWarning)
    from services.embedding_service import EmbeddingService
    service = EmbeddingService()
    return await service.embed_text(text)

async def retrieve_context(query: str, provinces: List[str]) -> List[str]:
    """Legacy wrapper - use PineconeService.retrieve_context instead."""
    warnings.warn("retrieve_context is deprecated. Use PineconeService.retrieve_context instead.", DeprecationWarning)
    from services.pinecone_service import PineconeService
    from services.embedding_service import EmbeddingService
    
    embedding_service = EmbeddingService()
    pinecone_service = PineconeService()
    
    vector = await embedding_service.embed_text(f"query: {query}")
    return await pinecone_service.retrieve_context(vector, provinces)

async def generate_rag_answer(question: str, provinces: List[str]) -> str:
    """Legacy wrapper - use RAGService.generate_answer instead."""
    warnings.warn("generate_rag_answer is deprecated. Use RAGService.generate_answer instead.", DeprecationWarning)
    service = RAGService()
    return await service.generate_answer(question, provinces)
