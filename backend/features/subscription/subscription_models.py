"""Subscription and rate limiting models."""

from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Integer, JSON, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database.base import Base
import uuid


class SubscriptionTier(Base):
    """Subscription tier model defining available plans."""
    
    __tablename__ = "subscription_tiers"
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)  # 'free', 'pro', 'enterprise'
    display_name = Column(String(100), nullable=False)  # 'Free Plan', 'Pro Plan', 'Enterprise Plan'
    price_usd = Column(Numeric(10, 2), nullable=False, default=0)  # Price in dollars
    
    # Rate limiting fields
    max_tokens_per_day = Column(Integer, nullable=True)  # NULL = unlimited
    max_tokens_per_month = Column(Integer, nullable=True)  # NULL = unlimited
    max_messages_per_day = Column(Integer, nullable=True)  # NULL = unlimited
    max_messages_per_hour = Column(Integer, nullable=True)  # NULL = unlimited
    max_concurrent_chats = Column(Integer, nullable=True)  # NULL = unlimited
    
    # Feature flags
    features = Column(JSON, nullable=False, default=dict)  # JSON object with feature flags
    
    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # Relationships
    user_subscriptions = relationship("UserSubscription", back_populates="tier")


class UserSubscription(Base):
    """User subscription model linking users to their current tier."""
    
    __tablename__ = "user_subscriptions"
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(PostgresUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tier_id = Column(PostgresUUID(as_uuid=True), ForeignKey("subscription_tiers.id", ondelete="RESTRICT"), nullable=False)
    
    # Subscription period
    started_at = Column(DateTime(timezone=True), default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)  # NULL = never expires (free tier)
    
    # Custom limits for enterprise customers
    custom_limits = Column(JSON, nullable=True)  # JSON object with overrides
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="subscription")
    tier = relationship("SubscriptionTier", back_populates="user_subscriptions")


class UserUsage(Base):
    """User usage tracking for rate limiting."""
    
    __tablename__ = "user_usage"
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(PostgresUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Time period
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    period_type = Column(String(20), nullable=False)  # 'hour', 'day', 'month'
    
    # Usage counters
    tokens_used = Column(Integer, default=0)
    messages_sent = Column(Integer, default=0)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="usage_records")
