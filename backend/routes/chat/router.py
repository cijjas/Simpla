"""Chat router with RAG and conversational endpoints."""

import logging
from fastapi import APIRouter, HTTPException, Depends
from .models import ChatRequest, ChatResponse, RagRequest, RagResponse, ChatMessage
from services import RAGService
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


def get_rag_service() -> RAGService:
    """Dependency to get RAG service instance."""
    return RAGService()


@router.post("/", response_model=RagResponse)
async def rag_endpoint(
    request: RagRequest,
    rag_service: RAGService = Depends(get_rag_service)
):
    """
    RAG Chat endpoint - matches frontend expectations.
    
    Accepts question and provinces, returns AI-generated answer based on 
    retrieved context from the vector database.
    """
    try:
        answer = await rag_service.generate_answer(
            question=request.question,
            provinces=request.provinces or []
        )
        return RagResponse(answer=answer)
        
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        raise HTTPException(
            status_code=503, 
            detail="Service temporarily unavailable - configuration error"
        )
    except Exception as e:
        logger.error(f"RAG processing error: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Internal server error during RAG processing"
        )


@router.post("/conversational", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Conversational Chat endpoint - for future conversational features.
    
    Note: This endpoint is currently not implemented and returns a placeholder response.
    """
    # TODO: Implement conversational chat when needed
    logger.warning("Conversational chat endpoint called but not implemented")
    
    return ChatResponse(
        message=ChatMessage(
            role="assistant",
            content="Conversational chat is not yet implemented. Please use the main chat endpoint."
        ),
        usage={
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0
        }
    )


@router.get("/health")
async def chat_health():
    """
    Health check for chat service.
    
    Returns the status of the chat service and validates configuration.
    """
    missing_keys = settings.validate_required_keys()
    
    if missing_keys:
        return {
            "status": "unhealthy",
            "service": "chat",
            "missing_config": missing_keys
        }
    
    return {
        "status": "healthy",
        "service": "chat",
        "features": {
            "rag": True,
            "conversational": False
        }
    }
