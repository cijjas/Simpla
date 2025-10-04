"""FastAPI router for conversations endpoints."""

import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import asyncio


from core.database.base import get_db
from features.auth.auth_utils import verify_token
from features.subscription.rate_limit_service import RateLimitService
from .service import ConversationService
from .schemas import (
    ConversationCreate,
    ConversationUpdate,
    ConversationListParams,
    ConversationListResponse,
    ConversationDetailResponse,
    SendMessageRequest
)
from core.utils.logging_config import get_logger
from features.conversations.answer_generator.grpc_client import fetch_norm_by_infoleg_id
from features.conversations.answer_generator.embedding_client import get_embedding
from features.conversations.answer_generator.vectorial_client import search_vectors

logger = get_logger(__name__)

router = APIRouter(prefix="/conversations", tags=["conversations"])


# Authentication dependency
def get_current_user_id(request: Request) -> str:
    """Get current user ID from JWT token without database query."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    payload = verify_token(token, "access")
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    return user_id


@router.get("/", response_model=ConversationListResponse)
async def get_conversations(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100, description="Number of conversations to return"),
    offset: int = Query(default=0, ge=0, description="Number of conversations to skip"),
    chat_type: Optional[str] = Query(default=None, description="Filter by chat type"),
    is_archived: bool = Query(default=False, description="Filter by archived status"),
    db: Session = Depends(get_db)
):
    """
    Get paginated list of conversations.
    
    Returns a list of conversations for the current user with pagination support.
    """
    try:
        user_id = get_current_user_id(request)
        
        # Validate chat_type
        if chat_type and chat_type not in ["normativa_nacional", "constituciones"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid chat_type. Must be 'normativa_nacional' or 'constituciones'"
            )
        
        params = ConversationListParams(
            limit=limit,
            offset=offset,
            chat_type=chat_type,
            is_archived=is_archived
        )
        
        service = ConversationService(db)
        conversations, total = service.get_conversations(user_id, params)
        
        # Convert to response format
        items = [
            ConversationDetailResponse.model_validate(conv) 
            for conv in conversations
        ]
        
        has_more = offset + limit < total
        
        return ConversationListResponse(
            items=items,
            total=total,
            limit=limit,
            offset=offset,
            has_more=has_more
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversations: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/", response_model=ConversationDetailResponse)
async def create_conversation(
    request: Request,
    data: ConversationCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new conversation.
    
    Creates a new conversation with the specified chat type and optional title.
    """
    try:
        user_id = get_current_user_id(request)
        
        service = ConversationService(db)
        conversation = service.create_conversation(user_id, data)
        
        return ConversationDetailResponse.model_validate(conversation)
        
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    request: Request,
    conversation_id: str,
    db: Session = Depends(get_db),
):
    """
    Get a conversation by ID with all messages.
    
    Returns the full conversation details including all messages in chronological order.
    """
    try:
        user_id = get_current_user_id(request)
        
        service = ConversationService(db)
        conversation = service.get_conversation_by_id(conversation_id, user_id)
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return ConversationDetailResponse.model_validate(conversation)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation {conversation_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/message", response_class=StreamingResponse)
async def send_message(
    request: Request,
    data: SendMessageRequest,
    db: Session = Depends(get_db),
):
    """
    Send a message and stream AI response using Server-Sent Events.
    
    Sends a user message and streams the AI response back in real-time.
    If no session_id is provided, creates a new conversation.
    Rate limiting is enforced based on user's subscription tier.
    """
    try:
        user_id = get_current_user_id(request)
        logger.info(f"Processing message for user: {user_id}")
        
        # Initialize rate limit service
        rate_limit_service = RateLimitService(db)
        
        # Estimate tokens needed (rough estimate before API call)
        estimated_tokens = max(50, len(data.content) // 4)  # Rough estimate
        logger.info(f"Estimated tokens: {estimated_tokens}")
        
        # Check rate limit BEFORE processing
        logger.info("Checking rate limit...")
        rate_limit_check = await rate_limit_service.check_rate_limit(
            user_id, 
            estimated_tokens
        )
        logger.info(f"Rate limit check result: {rate_limit_check.allowed}")
        
        if not rate_limit_check.allowed:
            logger.warning(f"Rate limit exceeded for user {user_id}: {rate_limit_check.message}")
            # Return error as streaming response
            async def error_stream():
                error_data = {
                    "content": f"Rate limit exceeded: {rate_limit_check.message}. Current usage: {rate_limit_check.current_usage}/{rate_limit_check.limit}. Resets at: {rate_limit_check.reset_at.isoformat()}",
                    "session_id": str(data.session_id) if data.session_id else "error",
                    "error": True,
                    "rate_limit_exceeded": True,
                    "current_usage": rate_limit_check.current_usage,
                    "limit": rate_limit_check.limit,
                    "reset_at": rate_limit_check.reset_at.isoformat(),
                    "upgrade_url": "/configuracion"
                }
                yield f"data: {json.dumps(error_data)}\n\n"
            
            return StreamingResponse(
                error_stream(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*",
                },
                status_code=429
            )
        
        service = ConversationService(db)

        async def generate_stream():
            """Generate streaming response."""
            try:
                actual_session_id = str(data.session_id) if data.session_id else "new-session"
                ai_response_content = ""
                
                # Stream the AI response
                async for chunk in service.stream_message_response(
                    user_id=user_id,
                    content=data.content,
                    session_id=str(data.session_id) if data.session_id else None,
                    chat_type=data.chat_type
                ):
                    # Check if this is a session_id chunk
                    if isinstance(chunk, tuple) and len(chunk) == 2 and chunk[0] == "session_id":
                        actual_session_id = chunk[1]
                        continue
                    
                    # Accumulate the AI response content
                    ai_response_content += chunk
                    
                    # Format as Server-Sent Events
                    response_data = {
                        "content": chunk,
                        "session_id": actual_session_id
                    }
                    yield f"data: {json.dumps(response_data)}\n\n"
                
                # Record actual usage after streaming is complete
                # Calculate total tokens used (user message + AI response)
                total_tokens = estimated_tokens + max(50, len(ai_response_content) // 4)
                logger.info(f"Recording usage: {total_tokens} tokens for user {user_id}")
                success = await rate_limit_service.record_usage(user_id, total_tokens)
                logger.info(f"Usage recording success: {success}")
                
                logger.info(f"Conversation request processed for user {user_id}, total tokens used: {total_tokens}")
                
                # Send final chunk to indicate completion
                yield f"data: {json.dumps({'content': '', 'session_id': actual_session_id, 'done': True})}\n\n"
                
            except Exception as e:
                logger.error(f"Error in message streaming: {str(e)}")
                error_data = {
                    "content": f"Error: {str(e)}",
                    "session_id": actual_session_id,
                    "error": True
                }
                yield f"data: {json.dumps(error_data)}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )
        
    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{conversation_id}")
async def delete_conversation(
    request: Request,
    conversation_id: str,
    db: Session = Depends(get_db),
):
    """
    Soft delete a conversation.
    
    Marks the conversation and all its messages as deleted without actually removing them from the database.
    """
    try:
        user_id = get_current_user_id(request)
        
        service = ConversationService(db)
        success = service.delete_conversation(conversation_id, user_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return {"message": "Conversation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation {conversation_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch("/{conversation_id}", response_model=ConversationDetailResponse)
async def update_conversation(
    request: Request,
    conversation_id: str,
    data: ConversationUpdate,
    db: Session = Depends(get_db),
):
    """
    Update a conversation.

    Updates conversation metadata like title and archived status.
    """
    try:
        user_id = get_current_user_id(request)

        service = ConversationService(db)
        conversation = service.update_conversation(conversation_id, user_id, data)

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        return ConversationDetailResponse.model_validate(conversation)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating conversation {conversation_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/test/grpc-norm")
async def test_grpc_norm(
    infoleg_id: int = Query(default=183532, description="Infoleg ID to fetch"),
    grpc_host: str = Query(default="localhost", description="gRPC server host"),
    grpc_port: int = Query(default=50051, description="gRPC server port")
):
    """
    Test endpoint to fetch norm data via gRPC.

    Calls the ReconstructNorm RPC on the relational microservice.
    """
    try:
        logger.info(f"Testing gRPC call for infoleg_id={infoleg_id}")
        result = fetch_norm_by_infoleg_id(infoleg_id, grpc_host, grpc_port)

        return {
            "success": result["success"],
            "message": result["message"],
            "norma_json": result["norma_json"],
            "grpc_endpoint": f"{grpc_host}:{grpc_port}"
        }

    except Exception as e:
        logger.error(f"Error testing gRPC: {str(e)}")
        raise HTTPException(status_code=500, detail=f"gRPC test failed: {str(e)}")
