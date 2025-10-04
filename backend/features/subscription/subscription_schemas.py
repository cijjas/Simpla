"""Pydantic schemas for subscription API endpoints."""

from pydantic import BaseModel, Field
from typing import Dict, Optional, Any
from datetime import datetime


class SubscriptionTierSchema(BaseModel):
    """Schema for subscription tier information."""
    id: str
    name: str
    display_name: str
    price_usd: float
    max_tokens_per_day: Optional[int] = None
    max_tokens_per_month: Optional[int] = None
    max_tokens_per_hour: Optional[int] = None
    max_messages_per_day: Optional[int] = None
    max_messages_per_hour: Optional[int] = None
    max_concurrent_chats: Optional[int] = None
    features: Dict[str, bool] = {}
    is_active: bool
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm(cls, obj):
        """Custom from_orm to handle UUID conversion."""
        data = {
            'id': str(obj.id),
            'name': obj.name,
            'display_name': obj.display_name,
            'price_usd': float(obj.price_usd),
            'max_tokens_per_day': obj.max_tokens_per_day,
            'max_tokens_per_month': obj.max_tokens_per_month,
            'max_messages_per_day': obj.max_messages_per_day,
            'max_messages_per_hour': obj.max_messages_per_hour,
            'max_concurrent_chats': obj.max_concurrent_chats,
            'features': obj.features or {},
            'is_active': obj.is_active,
        }
        return cls(**data)


class UserSubscriptionSchema(BaseModel):
    """Schema for user subscription information."""
    id: str
    user_id: str
    tier_id: str
    tier: SubscriptionTierSchema
    started_at: datetime
    expires_at: Optional[datetime] = None
    custom_limits: Optional[Dict[str, Any]] = None
    is_active: bool
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm(cls, obj):
        """Custom from_orm to handle UUID conversion."""
        data = {
            'id': str(obj.id),
            'user_id': str(obj.user_id),
            'tier_id': str(obj.tier_id),
            'tier': SubscriptionTierSchema.from_orm(obj.tier),
            'started_at': obj.started_at,
            'expires_at': obj.expires_at,
            'custom_limits': obj.custom_limits,
            'is_active': obj.is_active,
        }
        return cls(**data)


class UserUsageSchema(BaseModel):
    """Schema for user usage information."""
    id: str
    user_id: str
    period_start: datetime
    period_end: datetime
    period_type: str
    tokens_used: int
    messages_sent: int
    
    class Config:
        from_attributes = True


class RateLimitCheckSchema(BaseModel):
    """Schema for rate limit check results."""
    allowed: bool
    current_usage: int
    limit: int
    period_type: str
    reset_at: datetime
    message: Optional[str] = None


class SubscriptionStatusSchema(BaseModel):
    """Schema for user's current subscription status."""
    tier: SubscriptionTierSchema
    current_usage: Dict[str, int]
    limits: Dict[str, Optional[int]]
    features: Dict[str, bool]


class UpgradeSubscriptionRequest(BaseModel):
    """Request schema for upgrading subscription."""
    tier_name: str = Field(..., description="Name of the tier to upgrade to")


class UpgradeSubscriptionResponse(BaseModel):
    """Response schema for subscription upgrade."""
    success: bool
    message: str
    new_tier: SubscriptionTierSchema
