"""
Norma Chat API endpoints.

This module provides endpoints for AI chat functionality specific to individual normas.
"""

from core.utils.jwt_utils import verify_token
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Dict, Any
from pydantic import BaseModel, Field
import json

from core.database.base import get_db
from core.clients.relational import fetch_norm_by_id
from features.conversations.answer_generation.utils import build_enhanced_prompt
from features.conversations.ai_services.gemini_service import GeminiAIService
from features.conversations.ai_services.base import Message
from features.conversations.service import ConversationService
from features.subscription.rate_limit_service import RateLimitService
from core.utils.logging_config import get_logger

router = APIRouter()
logger = get_logger(__name__)

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


class NormaChatRequest(BaseModel):
    """Request model for norma-specific chat."""
    norma_id: int = Field(..., description="ID of the norma to ask about")
    question: str = Field(..., min_length=1, description="User's question about the norma")


class NormaChatResponse(BaseModel):
    """Response model for norma-specific chat."""
    answer: str = Field(..., description="AI answer specific to the norma")
    norma_id: int = Field(..., description="ID of the norma that was queried")


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
        
        # Attempt to fetch the complete norma content from relational service
        norma_context = None
        norma_available = False
        
        try:
            norma_result = fetch_norm_by_id(request.norma_id)
            
            if norma_result.get("success"):
                # Parse the norma JSON content
                norma_content = norma_result.get("norma_json", "")
                if norma_content:
                    try:
                        norma_data = json.loads(norma_content)
                        # Extract text content from the norma data
                        texto_norma = norma_data.get("textoNorma", "")
                        titulo = norma_data.get("tituloResumido", "") or norma_data.get("tituloSumario", "")
                        
                        if texto_norma or titulo:
                            # Build a focused context with the norma's complete content
                            norma_context = f"""
                                Título: {titulo}
                                Contenido completo de la norma:
                                {texto_norma}
                                """.strip()
                            norma_available = True
                            logger.info(f"Successfully fetched norma content for norma_id: {request.norma_id}")
                        
                    except json.JSONDecodeError:
                        # If JSON parsing fails, try to use the raw content
                        if norma_content:
                            norma_context = norma_content
                            norma_available = True
                            logger.warning(f"Could not parse norma JSON for norma_id: {request.norma_id}, using raw content")
            
            if not norma_available:
                logger.warning(f"Failed to fetch or parse norma {request.norma_id}: {norma_result.get('message', 'Unknown error')}")
                
        except Exception as fetch_error:
            logger.warning(f"Error fetching norma {request.norma_id}: {str(fetch_error)}")
        
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

                RESPUESTA:
                """
        else:
            # Create a fallback prompt using general legal knowledge
            enhanced_prompt = f"""
                Eres un asistente legal especializado en normativa argentina. El usuario te está preguntando sobre la norma con ID {request.norma_id}, pero actualmente no tengo acceso al contenido específico de esta norma.

                PREGUNTA DEL USUARIO: {request.question}

                INSTRUCCIONES:
                - Informa al usuario que no tienes acceso al contenido específico de la norma {request.norma_id}
                - Proporciona información general útil sobre el tema de la pregunta basándote en tu conocimiento de la legislación argentina
                - Sé breve y claro
                - Responde en español neutro
                - Mantén un tono profesional pero accesible

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
            session_id=None,  # Always create new conversation for norma chats
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
            norma_id=request.norma_id
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Error in norma chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")