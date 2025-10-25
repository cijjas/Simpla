"""User and authentication models."""

from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text, UUID
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database.base import Base
import uuid


class User(Base):
    """User model for authentication and user management."""
    
    __tablename__ = "users"
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Nullable for OAuth users
    name = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)  # Profile picture URL
    provider = Column(String(50), default="email")  # "email", "google"
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    email_verified = Column(Boolean, default=False)
    verification_token = Column(String(255), nullable=True)
    verification_token_expires = Column(DateTime(timezone=True), nullable=True)
    reset_token = Column(String(255), nullable=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    # folders = relationship("Folder", back_populates="user", cascade="all, delete-orphan")  # Will be set up after Folder is defined
    # chat_sessions = relationship("ChatSession", cascade="all, delete-orphan")  # Deprecated
    conversations = relationship("Conversation", cascade="all, delete-orphan")  # New conversations relationship
    subscription = relationship("UserSubscription", back_populates="user", cascade="all, delete-orphan", uselist=False)
    usage_records = relationship("UserUsage", back_populates="user", cascade="all, delete-orphan")


class RefreshToken(Base):
    """Refresh token model for JWT token management."""
    
    __tablename__ = "refresh_tokens"
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(PostgresUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(500), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked = Column(Boolean, default=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="refresh_tokens")
