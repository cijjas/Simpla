"""Pydantic schemas for conversations API."""

from datetime import datetime
from typing import Optional, List, Literal
from uuid import UUID
from pydantic import BaseModel, Field, validator


# Chat types
ChatType = Literal["normativa_nacional", "constituciones"]


# Base schemas
class MessageBase(BaseModel):
    """Base message schema."""
    role: Literal["system", "user", "assistant"]
    content: str
    tokens_used: int = 0
    metadata: Optional[dict] = None


class MessageCreate(MessageBase):
    """Schema for creating a message."""
    pass


class MessageResponse(MessageBase):
    """Schema for message response."""
    id: UUID
    created_at: datetime
    
    @classmethod
    def model_validate(cls, obj, **kwargs):
        """Custom validation to map message_metadata to metadata."""
        if hasattr(obj, 'message_metadata'):
            # Handle message_metadata - ensure it's a dict or None
            metadata = obj.message_metadata
            if metadata is not None and not isinstance(metadata, dict):
                # If it's not a dict, set to None
                metadata = None
            
            # Create a dict-like object with metadata field
            obj_dict = {
                'id': obj.id,
                'role': obj.role,
                'content': obj.content,
                'tokens_used': obj.tokens_used,
                'metadata': metadata,
                'created_at': obj.created_at
            }
            return super().model_validate(obj_dict, **kwargs)
        return super().model_validate(obj, **kwargs)
    
    class Config:
        from_attributes = True


# Conversation schemas
class ConversationBase(BaseModel):
    """Base conversation schema."""
    title: Optional[str] = None
    chat_type: ChatType
    system_prompt: Optional[str] = None


class ConversationCreate(ConversationBase):
    """Schema for creating a conversation."""
    pass


class ConversationUpdate(BaseModel):
    """Schema for updating a conversation."""
    title: Optional[str] = None
    is_archived: Optional[bool] = None


class ConversationResponse(ConversationBase):
    """Schema for conversation list response."""
    id: UUID
    snippet: Optional[str] = None
    create_time: datetime = Field(alias="created_at")
    update_time: datetime = Field(alias="updated_at")
    is_archived: bool = False
    total_tokens: int = 0
    
    class Config:
        from_attributes = True
        populate_by_name = True


class ConversationDetailResponse(ConversationBase):
    """Schema for detailed conversation response with messages."""
    id: UUID
    snippet: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_archived: bool = False
    total_tokens: int = 0
    messages: List[MessageResponse] = []
    
    @classmethod
    def model_validate(cls, obj, **kwargs):
        """Custom validation to handle message metadata properly."""
        if hasattr(obj, 'messages') and obj.messages:
            # Process each message to ensure metadata is handled correctly
            processed_messages = []
            for msg in obj.messages:
                if hasattr(msg, 'message_metadata'):
                    # Handle message_metadata - ensure it's a dict or None
                    metadata = msg.message_metadata
                    if metadata is not None and not isinstance(metadata, dict):
                        # If it's not a dict, set to None
                        metadata = None
                    
                    # Create a new message object with proper metadata
                    msg_dict = {
                        'id': msg.id,
                        'role': msg.role,
                        'content': msg.content,
                        'tokens_used': msg.tokens_used,
                        'metadata': metadata,
                        'created_at': msg.created_at
                    }
                    processed_messages.append(MessageResponse.model_validate(msg_dict))
                else:
                    processed_messages.append(MessageResponse.model_validate(msg))
            
            # Create a dict-like object with processed messages
            obj_dict = {
                'id': obj.id,
                'title': obj.title,
                'chat_type': obj.chat_type,
                'system_prompt': obj.system_prompt,
                'snippet': obj.snippet,
                'created_at': obj.created_at,
                'updated_at': obj.updated_at,
                'is_archived': obj.is_archived,
                'total_tokens': obj.total_tokens,
                'messages': processed_messages
            }
            return super().model_validate(obj_dict, **kwargs)
        return super().model_validate(obj, **kwargs)
    
    class Config:
        from_attributes = True


# Request schemas for API endpoints
class SendMessageRequest(BaseModel):
    """Schema for sending a message."""
    content: str = Field(..., min_length=1, max_length=10000)
    session_id: Optional[UUID] = None
    chat_type: ChatType


class SendMessageResponse(BaseModel):
    """Schema for send message response (streaming)."""
    content: str
    session_id: UUID


# Pagination schemas
class PaginationParams(BaseModel):
    """Schema for pagination parameters."""
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class ConversationListParams(PaginationParams):
    """Schema for conversation list query parameters."""
    chat_type: Optional[ChatType] = None
    is_archived: bool = False


class ConversationListResponse(BaseModel):
    """Schema for paginated conversation list response."""
    items: List[ConversationResponse]
    total: int
    limit: int
    offset: int
    has_more: bool


# System prompt templates
SYSTEM_PROMPTS = {
    "normativa_nacional": (
        "Eres un asistente legal especializado en normativa nacional argentina. "
        "Proporciona respuestas precisas basadas en la documentación legal disponible. "
        "Siempre cita las fuentes cuando sea posible y mantén un tono profesional y claro."
    ),
    "constituciones": (
        "Eres un asistente legal especializado en derecho constitucional. "
        "Proporciona análisis basados en constituciones y jurisprudencia constitucional. "
        "Siempre cita las fuentes cuando sea posible y mantén un tono profesional y claro."
    )
}


def get_system_prompt(chat_type: ChatType) -> str:
    """Get the default system prompt for a chat type."""
    return SYSTEM_PROMPTS.get(chat_type, SYSTEM_PROMPTS["normativa_nacional"])


def generate_snippet(content: str, max_length: int = 100) -> str:
    """Generate a snippet from message content."""
    if not content:
        return ""
    
    # Remove extra whitespace and newlines
    cleaned = " ".join(content.split())
    
    if len(cleaned) <= max_length:
        return cleaned
    
    return cleaned[:max_length].rstrip() + "..."


def generate_title(content: str, max_length: int = 50) -> str:
    """Generate a title from message content."""
    if not content:
        return "Nueva conversación"
    
    # Remove extra whitespace and newlines
    cleaned = " ".join(content.split())
    
    if len(cleaned) <= max_length:
        return cleaned
    
    return cleaned[:max_length].rstrip() + "..."
