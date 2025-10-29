"""
Norma Chat API endpoints.

This module provides endpoints for AI chat functionality specific to individual normas.
"""

from features.auth.auth_utils import get_current_user_id
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
import json

from core.database.base import get_db
from features.conversations.service import ConversationService
from features.subscription.rate_limit_service import RateLimitService
from core.utils.logging_config import get_logger
from shared.utils.norma_reconstruction import reconstruct_norma_by_infoleg_id, build_norma_text_context

router = APIRouter()
logger = get_logger(__name__)

# Authentication dependency now centralized in auth_utils


class NormaChatRequest(BaseModel):
    """Request model for norma-specific chat."""
    norma_id: int = Field(..., description="ID of the norma to ask about")
    question: str = Field(..., min_length=1, description="User's question about the norma")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")


class NormaChatResponse(BaseModel):
    """Response model for norma-specific chat."""
    answer: str = Field(..., description="AI answer specific to the norma")
    norma_id: int = Field(..., description="ID of the norma that was queried")
    session_id: str = Field(..., description="Session ID for conversation continuity")


@router.post("/norma-chat", response_model=NormaChatResponse)
async def norma_chat(
    request: NormaChatRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
) -> NormaChatResponse:
    """
    Get AI response for questions about a specific norma.
    
    This endpoint provides focused answers about individual normas without 
    the full RAG process - it uses the specific norma's content directly.
    Now persists conversations and counts tokens like normal conversations.
    """
    try:
        logger.info(f"Received norma chat request for norma_id: {request.norma_id} from user: {user_id}")
        
        # Initialize services
        conversation_service = ConversationService(db)
        rate_limit_service = RateLimitService(db)
        
        # Step 1: Rate limiting check
        estimated_tokens = max(50, len(request.question) // 4)
        rate_limit_check = await rate_limit_service.check_rate_limit(user_id, estimated_tokens)
        
        if not rate_limit_check.allowed:
            logger.warning(f"Rate limit exceeded for user {user_id}")
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded: {rate_limit_check.message}. Current usage: {rate_limit_check.current_usage}/{rate_limit_check.limit}. Resets at: {rate_limit_check.reset_at.isoformat()}"
            )
        
        # Attempt to fetch the complete norma content using direct database reconstruction
        norma_context = None
        norma_available = False
        
        try:
            # Use our working norma reconstruction logic
            norm_info = reconstruct_norma_by_infoleg_id(request.norma_id)
            
            if norm_info:
                # Build comprehensive context from the reconstructed norma
                norma_context = build_norma_text_context(norm_info)
                norma_available = True
                logger.info(f"Successfully reconstructed norma content for norma_id: {request.norma_id}")
            else:
                logger.warning(f"Failed to reconstruct norma {request.norma_id}: not found in database")
                
        except Exception as fetch_error:
            logger.warning(f"Error reconstructing norma {request.norma_id}: {str(fetch_error)}")
        
        # Create appropriate enhanced prompt based on whether norma content is available
        if norma_available and norma_context:
            # Create a specialized prompt for norma-specific questions with content
            enhanced_prompt = f"""
                Eres un asistente legal especializado. El usuario te está preguntando específicamente sobre esta norma. 
                Responde únicamente basándote en el contenido de esta norma específica.

                NORMA ESPECÍFICA:
                {norma_context}

                PREGUNTA DEL USUARIO: <pregunta_usuario> {request.question} </pregunta_usuario>

                INSTRUCCIONES:
                - Responde únicamente basándote en el contenido de esta norma específica
                - Si la pregunta no puede responderse con esta norma, indícalo claramente
                - Sé preciso y cita artículos específicos cuando sea relevante
                - Responde en español neutro
                - Mantén un tono profesional pero accesible
                - Responde de manera concisa y clara
                - Si la pregunta no está relacionada con la legislación Argentina, informa al usuario que eres un asistente legal y solo puedes responder preguntas sobre esta norma específica
                - Si la pregunta requiere de información externa a esta norma, indíque que debe consultar en la página de conversaciones

                RESPUESTA:
                """
        else:
            # Create a fallback prompt using general legal knowledge
            enhanced_prompt = f"""
                Eres un asistente legal especializado en normativa argentina. El usuario te está preguntando sobre la norma con ID {request.norma_id}, pero actualmente no tengo acceso al contenido específico de esta norma.

                PREGUNTA DEL USUARIO: {request.question}

                INSTRUCCIONES:
                - Informa al usuario que no tienes acceso al contenido específico de la norma.
                - Proporciona información general útil sobre el tema de la pregunta basándote en tu conocimiento de la legislación argentina
                - Sé breve y claro
                - Responde en español neutro
                - Mantén un tono profesional pero accesible
                - Responde de manera concisa y clara
                - Si la pregunta no está relacionada con la legislación Argentina, informa al usuario que eres un asistente legal y solo puedes responder preguntas sobre esta norma específica
                - Si la pregunta requiere de información externa a esta norma, indíque que debe consultar en la página de conversaciones

                RESPUESTA:
                """
        
        logger.info(f"Generating AI response for norma {request.norma_id}")
        
        # Step 2: Use conversation service to handle the message and persist it
        # This will create a conversation, persist messages, and stream the response
        ai_response_content = ""
        session_id = None
        
        # Collect the streamed response
        async for chunk in conversation_service.stream_message_response(
            user_id=user_id,
            content=request.question,  # Store original question in DB
            session_id=request.session_id,  # Use existing session ID or create new one
            chat_type="norma_chat",  # New chat type for norma-specific conversations
            norma_ids=[request.norma_id],  # Track which norma this is about
            enhanced_prompt=enhanced_prompt  # Use enhanced prompt for AI generation
        ):
            # Handle session_id metadata chunk
            if isinstance(chunk, tuple) and len(chunk) == 2 and chunk[0] == "session_id":
                session_id = chunk[1]
                continue
            
            # Accumulate content
            ai_response_content += chunk

        if not ai_response_content.strip():
            if norma_available:
                ai_response_content = "No se pudo generar una respuesta para esta consulta sobre la norma especificada."
            else:
                ai_response_content = f"No se pudo acceder al contenido de la norma {request.norma_id} y no se pudo generar una respuesta alternativa. Por favor, verifica el ID de la norma e intenta nuevamente."

        # Step 3: Record token usage (like in the normal conversation pipeline)
        total_tokens = estimated_tokens + max(50, len(ai_response_content) // 4)
        await rate_limit_service.record_usage(user_id, total_tokens)
        
        logger.info(f"Successfully generated response for norma {request.norma_id} (norma_content_available: {norma_available}), session_id: {session_id}, tokens: {total_tokens}")
        
        return NormaChatResponse(
            answer=ai_response_content.strip(),
            norma_id=request.norma_id,
            session_id=session_id or "unknown"  # Ensure we always return a session_id
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Error in norma chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")