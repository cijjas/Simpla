"""Message processing pipeline for conversations."""

import json
import asyncio
from typing import AsyncGenerator, Optional
from sqlalchemy.orm import Session

from .prompt_augmentation import reformulate_user_question
from .answer_generation.utils import fetch_and_parse_legal_context, build_enhanced_prompt
from .service import ConversationService
from .schemas import SendMessageRequest
from features.subscription.rate_limit_service import RateLimitService
from core.utils.logging_config import get_logger

logger = get_logger(__name__)


class MessagePipeline:
    """
    Handles the complete message processing pipeline from user input to AI response.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.rate_limit_service = RateLimitService(db)
        self.conversation_service = ConversationService(db)

    async def process_message(
        self, 
        user_id: str, 
        data: SendMessageRequest
    ) -> AsyncGenerator[str, None]:
        """
        Process a user message through the complete pipeline and stream the response.
        
        Args:
            user_id: The authenticated user ID
            data: The message request data
            
        Yields:
            Server-sent event formatted strings
        """
        try:
            logger.info(f"Processing message for user: {user_id}")

            # Step 1: Rate limiting
            estimated_tokens = max(50, len(data.content) // 4)
            rate_limit_check = await self.rate_limit_service.check_rate_limit(user_id, estimated_tokens)

            if not rate_limit_check.allowed:
                logger.warning(f"Rate limit exceeded for user {user_id}")
                async for chunk in self._generate_rate_limit_error(rate_limit_check, data.session_id):
                    yield chunk
                return

            # Step 2: Get conversation context (last 3 messages) if session exists
            context_messages = None
            if data.session_id:
                try:
                    logger.info(f"Attempting to load context for session_id: {data.session_id}")
                    conversation = self.conversation_service.get_conversation_by_id(str(data.session_id), user_id)
                    if conversation:
                        logger.info(f"Conversation found. Total messages in conversation: {len(conversation.messages)}")
                        if conversation.messages:
                            # Get last 3 messages, sorted by created_at (excluding deleted ones)
                            active_messages = [msg for msg in conversation.messages if not msg.is_deleted]
                            recent_messages = sorted(active_messages, key=lambda m: m.created_at)[-3:]
                            context_messages = [
                                {"role": msg.role, "content": msg.content}
                                for msg in recent_messages
                            ]
                            logger.info(f"Loaded {len(context_messages)} context messages for reformulation: {context_messages}")
                        else:
                            logger.info("No messages found in conversation")
                    else:
                        logger.info(f"Conversation not found for session_id: {data.session_id}")
                except Exception as e:
                    logger.warning(f"Could not load context messages: {str(e)}")
                    # Continue without context

            # Step 3: Question analysis and reformulation (with context)
            reformulated_question = await reformulate_user_question(data.content, context_messages)

            # Step 4: Handle non-legal questions
            if reformulated_question == "NON-LEGAL":
                async for chunk in self._generate_non_legal_response(reformulated_question, data.session_id):
                    yield chunk
                return

            # Step 5: Handle clarification requests (vague questions)
            if reformulated_question.startswith("CLARIFICATION:"):
                clarification_text = reformulated_question.replace("CLARIFICATION:", "").strip()
                async for chunk in self._generate_clarification_response(clarification_text, data.session_id):
                    yield chunk
                return

            # Step 6: Handle reformulate request (2nd clarification needed)
            if reformulated_question == "REFORMULATE_REQUEST":
                reformulate_message = "Por favor, reformula tu pregunta de manera más completa para poder ayudarte mejor. Intenta incluir todos los detalles relevantes en tu consulta."
                async for chunk in self._generate_reformulate_request_response(reformulate_message, data.session_id):
                    yield chunk
                return

            # Step 7: Legal question processing pipeline (only if clear enough)
            async for chunk in self._process_legal_question(
                user_id, 
                data, 
                reformulated_question,
                estimated_tokens
            ):
                yield chunk

        except Exception as e:
            logger.error(f"Error in message pipeline: {str(e)}")
            actual_session_id = str(data.session_id) if data.session_id else "error"
            error_data = {
                "content": f"An error occurred while processing your message: {str(e)}", 
                "session_id": actual_session_id, 
                "error": True
            }
            yield f"data: {json.dumps(error_data)}\n\n"

    async def _generate_rate_limit_error(
        self, 
        rate_limit_check, 
        session_id: Optional[str]
    ) -> AsyncGenerator[str, None]:
        """Generate rate limit error response."""
        error_data = {
            "content": f"Rate limit exceeded: {rate_limit_check.message}. Current usage: {rate_limit_check.current_usage}/{rate_limit_check.limit}. Resets at: {rate_limit_check.reset_at.isoformat()}",
            "session_id": str(session_id) if session_id else "error",
            "error": True,
            "rate_limit_exceeded": True,
            "current_usage": rate_limit_check.current_usage,
            "limit": rate_limit_check.limit,
            "reset_at": rate_limit_check.reset_at.isoformat(),
            "upgrade_url": "/configuracion"
        }
        yield f"data: {json.dumps(error_data)}\n\n"

    async def _generate_non_legal_response(
        self,
        reformulated_question: str,
        session_id: Optional[str]
    ) -> AsyncGenerator[str, None]:
        """Generate response for non-legal questions."""
        non_legal_message = "Soy un asistente legal especializado en normativa argentina, estoy aquí para responder preguntas únicamente sobre la legislación argentina. ¿En qué puedo ayudarte hoy?"

        try:
            # Stream the message word by word for a natural feel
            words = non_legal_message.split()
            for i, word in enumerate(words):
                chunk = word + (" " if i < len(words) - 1 else "")
                # Only include session_id if we have it
                chunk_data = {'content': chunk}
                if session_id:
                    chunk_data['session_id'] = str(session_id)
                yield f"data: {json.dumps(chunk_data)}\n\n"
                await asyncio.sleep(0.05)  # Small delay for natural typing effect

            # Send completion signal (must have session_id by now, or frontend will handle)
            completion_data = {'content': '', 'done': True}
            if session_id:
                completion_data['session_id'] = str(session_id)
            yield f"data: {json.dumps(completion_data)}\n\n"

        except Exception as e:
            logger.error(f"Error in non-legal streaming: {str(e)}")
            error_data = {"content": f"Error: {str(e)}", "error": True}
            if session_id:
                error_data["session_id"] = str(session_id)
            yield f"data: {json.dumps(error_data)}\n\n"

    async def _generate_clarification_response(
        self,
        clarification_text: str,
        session_id: Optional[str]
    ) -> AsyncGenerator[str, None]:
        """Generate response for clarification requests (vague questions)."""
        try:
            logger.info(f"Generating clarification response: {clarification_text}")

            # Stream the clarification question word by word for a natural feel
            words = clarification_text.split()
            for i, word in enumerate(words):
                chunk = word + (" " if i < len(words) - 1 else "")
                # Only include session_id if we have it
                chunk_data = {'content': chunk}
                if session_id:
                    chunk_data['session_id'] = str(session_id)
                yield f"data: {json.dumps(chunk_data)}\n\n"
                await asyncio.sleep(0.05)  # Small delay for natural typing effect

            # Send completion signal (no norma_ids for clarifications)
            completion_data = {'content': '', 'done': True}
            if session_id:
                completion_data['session_id'] = str(session_id)
            yield f"data: {json.dumps(completion_data)}\n\n"

        except Exception as e:
            logger.error(f"Error in clarification streaming: {str(e)}")
            error_data = {"content": f"Error: {str(e)}", "error": True}
            if session_id:
                error_data["session_id"] = str(session_id)
            yield f"data: {json.dumps(error_data)}\n\n"

    async def _generate_reformulate_request_response(
        self,
        reformulate_message: str,
        session_id: Optional[str]
    ) -> AsyncGenerator[str, None]:
        """Generate response for reformulate requests (2nd clarification needed)."""
        try:
            logger.info(f"Generating reformulate request response: {reformulate_message}")

            # Stream the reformulate request word by word for a natural feel
            words = reformulate_message.split()
            for i, word in enumerate(words):
                chunk = word + (" " if i < len(words) - 1 else "")
                # Only include session_id if we have it
                chunk_data = {'content': chunk}
                if session_id:
                    chunk_data['session_id'] = str(session_id)
                yield f"data: {json.dumps(chunk_data)}\n\n"
                await asyncio.sleep(0.05)  # Small delay for natural typing effect

            # Send completion signal (no norma_ids for reformulate requests)
            completion_data = {'content': '', 'done': True}
            if session_id:
                completion_data['session_id'] = str(session_id)
            yield f"data: {json.dumps(completion_data)}\n\n"

        except Exception as e:
            logger.error(f"Error in reformulate request streaming: {str(e)}")
            error_data = {"content": f"Error: {str(e)}", "error": True}
            if session_id:
                error_data["session_id"] = str(session_id)
            yield f"data: {json.dumps(error_data)}\n\n"

    async def _process_legal_question(
        self, 
        user_id: str, 
        data: SendMessageRequest, 
        reformulated_question: str,
        estimated_tokens: int
    ) -> AsyncGenerator[str, None]:
        """Process legal questions through the full RAG pipeline."""
        try:
            logger.info(f"Processing legal question. Original: {data.content}, Reformulated: {reformulated_question}")
            
            # Step 1: Fetch legal context and norma IDs
            normas_data, norma_ids = fetch_and_parse_legal_context(reformulated_question)

            # Step 2: Build enhanced prompt
            enhanced_prompt = build_enhanced_prompt(data.content, normas_data, data.tone)

            # Step 3: Generate AI response
            ai_response_content = ""
            actual_session_id = str(data.session_id) if data.session_id else None

            try:
                # Stream AI response chunks
                async for chunk in self.conversation_service.stream_message_response(
                    user_id=user_id,
                    content=data.content,  # Use original user content for message storage
                    session_id=str(data.session_id) if data.session_id else None,
                    chat_type=data.chat_type,
                    norma_ids=norma_ids,
                    enhanced_prompt=enhanced_prompt  # Pass enhanced prompt separately for AI generation
                ):
                    # Handle session_id metadata chunk
                    if isinstance(chunk, tuple) and len(chunk) == 2 and chunk[0] == "session_id":
                        actual_session_id = chunk[1]
                        continue

                    # Accumulate and stream content
                    ai_response_content += chunk
                    # Only include session_id if we have it
                    chunk_data = {'content': chunk}
                    if actual_session_id:
                        chunk_data['session_id'] = actual_session_id
                    yield f"data: {json.dumps(chunk_data)}\n\n"

                # Step 4: Record token usage
                total_tokens = estimated_tokens + max(50, len(ai_response_content) // 4)
                await self.rate_limit_service.record_usage(user_id, total_tokens)
                logger.info(f"Conversation processed for user {user_id}, tokens: {total_tokens}")

                # Send completion signal with norma IDs
                completion_data = {
                    'content': '',
                    'done': True,
                    'norma_ids': norma_ids
                }
                if actual_session_id:
                    completion_data['session_id'] = actual_session_id
                yield f"data: {json.dumps(completion_data)}\n\n"

            except Exception as e:
                logger.error(f"Error in AI response streaming: {str(e)}")
                error_data = {"content": f"Error: {str(e)}", "error": True}
                if actual_session_id:
                    error_data["session_id"] = actual_session_id
                yield f"data: {json.dumps(error_data)}\n\n"
                
        except Exception as e:
            logger.error(f"Error in legal question processing: {str(e)}")
            actual_session_id = str(data.session_id) if data.session_id else "error"
            error_data = {"content": f"Error processing legal question: {str(e)}", "session_id": actual_session_id, "error": True}
            yield f"data: {json.dumps(error_data)}\n\n"


async def create_rate_limit_error_response(
    rate_limit_check,
    session_id: Optional[str]
) -> AsyncGenerator[str, None]:
    """Create a streaming error response for rate limit exceeded."""
    error_data = {
        "content": f"Rate limit exceeded: {rate_limit_check.message}. Current usage: {rate_limit_check.current_usage}/{rate_limit_check.limit}. Resets at: {rate_limit_check.reset_at.isoformat()}",
        "session_id": str(session_id) if session_id else "error",
        "error": True,
        "rate_limit_exceeded": True,
        "current_usage": rate_limit_check.current_usage,
        "limit": rate_limit_check.limit,
        "reset_at": rate_limit_check.reset_at.isoformat(),
        "upgrade_url": "/configuracion"
    }
    yield f"data: {json.dumps(error_data)}\n\n"
