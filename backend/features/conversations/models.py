"""SQLAlchemy models for conversations and messages."""

import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column, String, Integer, Text, DateTime, ForeignKey, Boolean, 
    Numeric, CheckConstraint, Index
)
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database.base import Base


class Conversation(Base):
    """Model for chat conversations."""
    
    __tablename__ = "conversations"  # Different table name to avoid conflicts
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(PostgresUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(Text, nullable=True)
    chat_type = Column(String(50), nullable=False)  # 'normativa_nacional' or 'constituciones'
    snippet = Column(Text, nullable=True)  # First user message preview
    system_prompt = Column(Text, nullable=True)
    total_tokens = Column(Integer, default=0)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Constraints
    __table_args__ = (
        CheckConstraint(
            "chat_type IN ('normativa_nacional', 'constituciones', 'norma_chat')",
            name="check_conversation_chat_type"
        ),
        Index('idx_conversations_user_updated', 'user_id', 'updated_at', postgresql_where=is_deleted == False),
    )
    
    # Relationships
    user = relationship("User", back_populates="conversations")
    messages = relationship("ConversationMessage", back_populates="conversation", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Conversation(id={self.id}, title={self.title}, chat_type={self.chat_type})>"


class ConversationMessage(Base):
    """Model for conversation messages."""
    
    __tablename__ = "conversation_messages"  # Different table name to avoid conflicts
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    conversation_id = Column(PostgresUUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # 'system', 'user', 'assistant'
    content = Column(Text, nullable=False)
    tokens_used = Column(Integer, default=0)
    cost_usd = Column(Numeric(10, 4), default=0.0)
    message_metadata = Column(JSONB, nullable=True)
    attached_file_names = Column(JSONB, nullable=True)  # List of attached file names
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Constraints
    __table_args__ = (
        CheckConstraint(
            "role IN ('system', 'user', 'assistant')",
            name="check_conversation_message_role"
        ),
        Index('idx_conversation_messages_conversation_created', 'conversation_id', 'created_at', postgresql_where=is_deleted == False),
    )
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self) -> str:
        return f"<ConversationMessage(id={self.id}, role={self.role}, conversation_id={self.conversation_id})>"


# Alias for backward compatibility
Message = ConversationMessage

