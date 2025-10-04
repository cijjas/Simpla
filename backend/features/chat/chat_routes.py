"""Chat router with RAG and conversational endpoints."""

import logging
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from features.chat.chat_models import ChatRequest, ChatResponse, RagRequest, RagResponse, ChatMessage
from features.chat.chat_rag_service import RAGService
from features.auth.auth_utils import get_current_user
from features.auth.auth_models import User
from features.subscription.rate_limit_service import RateLimitService
from core.database.base import get_db
from core.config.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


def get_rag_service() -> RAGService:
    """Dependency to get RAG service instance."""
    return RAGService()


@router.post("/", response_model=RagResponse)
async def rag_endpoint(
    request: RagRequest,
    current_user: User = Depends(get_current_user),
    rag_service: RAGService = Depends(get_rag_service),
    db: Session = Depends(get_db)
):
    """
    RAG Chat endpoint - matches frontend expectations.
    
    Accepts question and provinces, returns AI-generated answer based on 
    retrieved context from the vector database.
    
    Requires authentication - user must be logged in to use chat functionality.
    Rate limiting is enforced based on user's subscription tier.
    """
    try:
        # Initialize rate limit service
        rate_limit_service = RateLimitService(db)
        
        # Estimate tokens needed (rough estimate before API call)
        estimated_tokens = max(50, len(request.question) // 4)  # Rough estimate
        
        # Check rate limit BEFORE processing
        rate_limit_check = await rate_limit_service.check_rate_limit(
            current_user.id, 
            estimated_tokens
        )
        
        if not rate_limit_check.allowed:
            logger.warning(f"Rate limit exceeded for user {current_user.id}: {rate_limit_check.message}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "Rate limit exceeded",
                    "message": rate_limit_check.message,
                    "current_usage": rate_limit_check.current_usage,
                    "limit": rate_limit_check.limit,
                    "reset_at": rate_limit_check.reset_at.isoformat(),
                    "upgrade_url": "/pricing"
                }
            )
        
        # Process the request
        answer = await rag_service.generate_answer(
            question=request.question,
            provinces=request.provinces or []
        )
        
        # Record actual usage (use estimated tokens for now)
        # In a real implementation, you'd get actual token count from the API response
        await rate_limit_service.record_usage(current_user.id, estimated_tokens)
        
        logger.info(f"RAG request processed for user {current_user.id}, tokens used: {estimated_tokens}")
        return RagResponse(answer=answer)
        
    except HTTPException:
        raise
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
async def chat_endpoint(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
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
