"""SQLAlchemy models for notifications."""

from sqlalchemy import Column, String, Boolean, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from core.database.base import Base
import uuid


class Notification(Base):
    """Notification model."""
    
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(Text, nullable=False)
    body = Column(Text, nullable=True)
    type = Column(String(50), nullable=False)
    link = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    # Use metadata_ to avoid conflict with SQLAlchemy's reserved 'metadata' attribute
    metadata_ = Column("metadata", JSONB, default={}, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    __table_args__ = (
        CheckConstraint(
            type.in_(['norm_update', 'subscription_warning', 'free_tier_limit', 'system', 'other']),
            name='notifications_type_check'
        ),
    )

