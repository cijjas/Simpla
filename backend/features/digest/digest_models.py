"""Database models for weekly digest feature."""

from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, Integer, Text, Date, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from core.database.base import Base
import uuid


class DigestUserPreferences(Base):
    """Model for user digest preferences."""
    
    __tablename__ = "digest_user_preferences"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    filter_options = Column(JSONB, nullable=False, default=text("'{}'::jsonb"))
    
    # Relationships
    # user = relationship("User", backref="digest_preferences")


class DigestWeekly(Base):
    """Model for weekly digest reports."""
    
    __tablename__ = "digest_weekly"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    week_start = Column(Date, nullable=False)
    week_end = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    article_summary = Column(Text, nullable=True)
    total_normas = Column(Integer, nullable=True)
    article_json = Column(JSONB, nullable=True)
    
    __table_args__ = (
        # Unique constraint on week_start and week_end
        {'schema': None},
    )

