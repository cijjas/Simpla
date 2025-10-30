"""Business logic service for conversations."""

import uuid
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload

from .models import Conversation, Message
from .schemas import (
    ConversationCreate, 
    ConversationUpdate, 
    ConversationListParams,
    MessageCreate,
    get_system_prompt,
    generate_snippet,
    generate_title
)
from .ai_service import get_ai_service_instance, Message as AIMessage
from core.utils.logging_config import get_logger

logger = get_logger(__name__)


class ConversationService:
    """Service class for conversation business logic."""
    
    def __init__(self, db: Session):
        self.db = db
        self.ai_service = get_ai_service_instance()
    
    def get_conversations(
        self, 
        user_id: str,
        params: ConversationListParams
    ) -> Tuple[List[Conversation], int]:
        """Get paginated list of conversations for a user."""
        try:
            # Build base filters
            filters = and_(
                Conversation.user_id == user_id,
                Conversation.is_deleted == False  # noqa: E712
            )
            
            # Apply optional filters
            if params.chat_type:
                filters = and_(filters, Conversation.chat_type == params.chat_type)
            
            if params.is_archived is not None:
                filters = and_(filters, Conversation.is_archived == params.is_archived)
            
            # OPTIMIZED: Direct count query instead of subquery
            # This is much faster as it uses the index directly
            total = self.db.query(func.count(Conversation.id)).filter(filters).scalar() or 0
            
            # Build main query
            query = select(Conversation).where(filters)
            
            # Apply pagination and ordering
            query = query.order_by(Conversation.updated_at.desc())
            query = query.offset(params.offset).limit(params.limit)
            
            # Execute query
            result = self.db.execute(query)
            conversations = result.scalars().all()
            
            return conversations, total
            
        except Exception as e:
            logger.error(f"Error getting conversations: {str(e)}")
            raise
    
    def get_conversation_by_id(
        self, 
        conversation_id: str, 
        user_id: str
    ) -> Optional[Conversation]:
        """Get a conversation by ID with all messages."""
        try:
            query = select(Conversation).options(
                selectinload(Conversation.messages)
            ).where(
                and_(
                    Conversation.id == conversation_id,
                    Conversation.user_id == user_id,
                    Conversation.is_deleted == False
                )
            )
            
            result = self.db.execute(query)
            conversation = result.scalar_one_or_none()
            
            if conversation:
                # Sort messages by created_at
                conversation.messages.sort(key=lambda m: m.created_at)
            
            return conversation
            
        except Exception as e:
            logger.error(f"Error getting conversation {conversation_id}: {str(e)}")
            raise
    
    def create_conversation(
        self, 
        user_id: str,
        data: ConversationCreate
    ) -> Conversation:
        """Create a new conversation."""
        try:
            # Generate system prompt if not provided
            system_prompt = data.system_prompt or get_system_prompt(data.chat_type)
            
            conversation = Conversation(
                user_id=user_id,
                title=data.title,
                chat_type=data.chat_type,
                system_prompt=system_prompt,
                is_archived=False
            )
            
            self.db.add(conversation)
            self.db.commit()
            self.db.refresh(conversation)
            
            logger.info(f"Created conversation {conversation.id} for user {user_id}")
            return conversation
            
        except Exception as e:
            logger.error(f"Error creating conversation: {str(e)}")
            self.db.rollback()
            raise
    
    def update_conversation(
        self, 
        conversation_id: str, 
        user_id: str,
        data: ConversationUpdate
    ) -> Optional[Conversation]:
        """Update a conversation."""
        try:
            conversation = self.get_conversation_by_id(conversation_id, user_id)
            if not conversation:
                return None
            
            # Update fields
            if data.title is not None:
                conversation.title = data.title
            if data.is_archived is not None:
                conversation.is_archived = data.is_archived
            
            conversation.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(conversation)
            
            logger.info(f"Updated conversation {conversation_id}")
            return conversation
            
        except Exception as e:
            logger.error(f"Error updating conversation {conversation_id}: {str(e)}")
            self.db.rollback()
            raise
    
    def delete_conversation(
        self, 
        conversation_id: str, 
        user_id: str
    ) -> bool:
        """Soft delete a conversation."""
        try:
            conversation = self.get_conversation_by_id(conversation_id, user_id)
            if not conversation:
                return False
            
            # Soft delete conversation
            conversation.is_deleted = True
            conversation.deleted_at = datetime.utcnow()
            conversation.updated_at = datetime.utcnow()
            
            # Soft delete all messages
            for message in conversation.messages:
                message.is_deleted = True
                message.deleted_at = datetime.utcnow()
                message.updated_at = datetime.utcnow()
            
            self.db.commit()
            
            logger.info(f"Deleted conversation {conversation_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting conversation {conversation_id}: {str(e)}")
            self.db.rollback()
            raise
    
    def create_message(
        self, 
        session_id: str, 
        data: MessageCreate
    ) -> Message:
        """Create a new message."""
        try:
            message = Message(
                conversation_id=session_id,
                role=data.role,
                content=data.content,
                tokens_used=data.tokens_used,
                message_metadata=data.metadata,
                attached_file_names=data.attached_file_names
            )
            
            self.db.add(message)
            self.db.commit()
            self.db.refresh(message)
            
            return message
            
        except Exception as e:
            logger.error(f"Error creating message: {str(e)}")
            self.db.rollback()
            raise
    
    async def send_message_and_get_response(
        self, 
        user_id: str,
        content: str,
        session_id: Optional[str] = None,
        chat_type: str = "normativa_nacional"
    ) -> Tuple[Conversation, Message, Message]:
        """Send a message and get AI response."""
        try:
            # Get or create conversation
            if session_id:
                conversation = self.get_conversation_by_id(session_id, user_id)
                if not conversation:
                    raise ValueError("Conversation not found")
            else:
                # Create new conversation
                conversation_data = ConversationCreate(
                    chat_type=chat_type,
                    title=generate_title(content)
                )
                conversation = self.create_conversation(user_id, conversation_data)
                session_id = str(conversation.id)
            
            # Create user message
            user_message_data = MessageCreate(
                role="user",
                content=content,
                tokens_used=self.ai_service.count_tokens(content)
            )
            user_message = self.create_message(session_id, user_message_data)
            
            # Get conversation history for context
            history_messages = [
                AIMessage(role=msg.role, content=msg.content) 
                for msg in conversation.messages 
                if not msg.is_deleted
            ]
            
            # Add the new user message to history
            history_messages.append(AIMessage(role="user", content=content))
            
            # Generate AI response
            system_prompt = conversation.system_prompt or get_system_prompt(chat_type)
            ai_response_content = ""
            
            # Stream AI response and collect it
            async for chunk in self.ai_service.generate_stream(
                history_messages, 
                system_prompt
            ):
                ai_response_content += chunk
            
            # Create assistant message
            assistant_message_data = MessageCreate(
                role="assistant",
                content=ai_response_content,
                tokens_used=self.ai_service.count_tokens(ai_response_content),
                metadata={"relevant_docs": []}  # TODO: Add RAG integration
            )
            assistant_message = self.create_message(session_id, assistant_message_data)
            
            # Update conversation
            conversation.updated_at = datetime.utcnow()
            conversation.total_tokens += user_message.tokens_used + assistant_message.tokens_used
            
            # Update snippet if this is the first message
            if not conversation.snippet:
                conversation.snippet = generate_snippet(content)
            
            self.db.commit()
            
            logger.info(f"Processed message for conversation {session_id}")
            return conversation, user_message, assistant_message
            
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            self.db.rollback()
            raise
    
    async def stream_message_response(
        self, 
        user_id: str,
        content: str,
        session_id: Optional[str] = None,
        chat_type: str = "normativa_nacional",
        norma_ids: Optional[List[int]] = None,
        enhanced_prompt: Optional[str] = None,
        files: Optional[List] = None
    ):
        """Stream AI response for a message."""
        try:
            # Get or create conversation
            if session_id:
                conversation = self.get_conversation_by_id(session_id, user_id)
                if not conversation:
                    raise ValueError("Conversation not found")
            else:
                # Create new conversation
                conversation_data = ConversationCreate(
                    chat_type=chat_type,
                    title=generate_title(content)
                )
                conversation = self.create_conversation(user_id, conversation_data)
                session_id = str(conversation.id)
            
            # Yield the session_id first so the router knows what it is
            yield ("session_id", session_id)
            
            # Extract file names if files are provided
            attached_file_names = None
            if files:
                attached_file_names = [file.name for file in files]
            
            # Create user message
            user_message_data = MessageCreate(
                role="user",
                content=content,
                tokens_used=self.ai_service.count_tokens(content),
                attached_file_names=attached_file_names
            )
            user_message = self.create_message(session_id, user_message_data)
            
            # Get conversation history for context
            history_messages = [
                AIMessage(role=msg.role, content=msg.content) 
                for msg in conversation.messages 
                if not msg.is_deleted
            ]
            
            # Add the new user message to history for context
            # Use enhanced_prompt if provided, otherwise use original content
            user_content_for_ai = enhanced_prompt if enhanced_prompt else content
            
            # Convert files from schema format to FilePart objects
            file_parts = None
            if files:
                import base64
                from features.conversations.ai_services.base import FilePart
                # Debug: log files received (names/mime types only if available)
                try:
                    logger.info(f"Received {len(files)} file(s) for AI service: "
                                f"{[getattr(f, 'mime_type', 'unknown') for f in files]}")
                except Exception:
                    logger.info("Received files for AI service (could not list details)")

                file_parts = [
                    FilePart(
                        mime_type=file.mime_type,
                        data=base64.b64decode(file.data)
                    )
                    for file in files
                ]
            
            history_messages.append(AIMessage(role="user", content=user_content_for_ai, files=file_parts))
            
            # Generate AI response
            system_prompt = conversation.system_prompt or get_system_prompt(chat_type)
            ai_response_content = ""
            
            # Stream AI response
            async for chunk in self.ai_service.generate_stream(
                history_messages, 
                system_prompt
            ):
                ai_response_content += chunk
                yield chunk
            
            # Create assistant message after streaming is complete
            metadata = {"relevant_docs": []}
            if norma_ids:
                metadata["relevant_docs"] = norma_ids
                
            assistant_message_data = MessageCreate(
                role="assistant",
                content=ai_response_content,
                tokens_used=self.ai_service.count_tokens(ai_response_content),
                metadata=metadata
            )
            assistant_message = self.create_message(session_id, assistant_message_data)
            
            # Update conversation
            conversation.updated_at = datetime.utcnow()
            conversation.total_tokens += user_message.tokens_used + assistant_message.tokens_used
            
            # Update snippet if this is the first message
            if not conversation.snippet:
                conversation.snippet = generate_snippet(content)
            
            self.db.commit()
            
            logger.info(f"Streamed response for conversation {session_id}")
            
        except Exception as e:
            logger.error(f"Error streaming message response: {str(e)}")
            self.db.rollback()
            raise