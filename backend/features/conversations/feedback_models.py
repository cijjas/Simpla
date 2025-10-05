"""SQLAlchemy models for message feedback."""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, ForeignKey, CheckConstraint, Index
)
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database.base import Base


class MessageFeedback(Base):
    """Model for message feedback (likes/dislikes)."""
    
    __tablename__ = "message_feedback"
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(PostgresUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    message_id = Column(PostgresUUID(as_uuid=True), ForeignKey("conversation_messages.id", ondelete="CASCADE"), nullable=False, index=True)
    feedback_type = Column(String(20), nullable=False)  # 'like' or 'dislike'
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # Constraints
    __table_args__ = (
        CheckConstraint(
            "feedback_type IN ('like', 'dislike')",
            name="check_feedback_type"
        ),
        Index('idx_message_feedback_user_message', 'user_id', 'message_id', unique=True),
    )
    
    # Relationships
    user = relationship("User", backref="message_feedbacks")
    message = relationship("ConversationMessage", backref="feedbacks")

    def __repr__(self) -> str:
        return f"<MessageFeedback(id={self.id}, message_id={self.message_id}, feedback_type={self.feedback_type})>"


