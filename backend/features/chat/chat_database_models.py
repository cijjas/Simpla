"""SQLAlchemy models for chat sessions and messages."""

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Boolean, Numeric, JSON
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database.base import Base
import uuid


class ChatSession(Base):
    """Model for chat sessions."""
    
    __tablename__ = "chat_sessions"
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(PostgresUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(Text, nullable=True)
    system_prompt = Column(Text, nullable=True)
    total_tokens = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")


class Message(Base):
    """Model for chat messages."""
    
    __tablename__ = "messages"
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    session_id = Column(PostgresUUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # 'system', 'user', 'assistant'
    content = Column(Text, nullable=False)
    tokens_used = Column(Integer, default=0)
    cost_usd = Column(Numeric(10, 4), default=0.0)
    message_metadata = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Constraints
    __table_args__ = (
        # Check constraint for valid roles
        # Note: PostgreSQL CHECK constraints with IN clause
    )
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")
