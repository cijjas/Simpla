"""Subscription management routes."""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from core.database.base import get_db
from features.auth.auth_utils import get_current_user
from features.auth.auth_models import User
from features.subscription.subscription_models import SubscriptionTier, UserSubscription
from features.subscription.subscription_schemas import (
    SubscriptionStatusSchema,
    UpgradeSubscriptionRequest,
    UpgradeSubscriptionResponse,
    SubscriptionTierSchema
)
from features.subscription.rate_limit_service import RateLimitService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/subscription", tags=["subscription"])


@router.get("/status", response_model=SubscriptionStatusSchema)
async def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's subscription info and usage."""
    try:
        rate_limit_service = RateLimitService(db)
        
        # Get user's limits
        limits = await rate_limit_service.get_user_limits(current_user.id)
        
        if not limits:
            # Try to assign free tier automatically
            free_tier = db.query(SubscriptionTier).filter(SubscriptionTier.name == "free").first()
            if free_tier:
                subscription = UserSubscription(
                    user_id=current_user.id,
                    tier_id=free_tier.id,
                    expires_at=None  # Free tier never expires
                )
                db.add(subscription)
                db.commit()
                logger.info(f"Auto-assigned free tier to user: {current_user.email}")
                
                # Try to get limits again
                limits = await rate_limit_service.get_user_limits(current_user.id)
            
            if not limits:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No active subscription found"
                )
        
        # Get current usage
        daily_usage = await rate_limit_service.get_current_usage(current_user.id, "day")
        hourly_usage = await rate_limit_service.get_current_usage(current_user.id, "hour")
        
        # Build response
        tier_schema = SubscriptionTierSchema(
            id=str(limits['tier_id']),
            name=limits['tier_name'],
            display_name=limits['display_name'],
            price_usd=0,  # Will be populated from actual tier data
            max_tokens_per_day=limits['max_tokens_per_day'],
            max_tokens_per_month=limits['max_tokens_per_month'],
            max_messages_per_day=limits['max_messages_per_day'],
            max_messages_per_hour=limits['max_messages_per_hour'],
            max_concurrent_chats=limits['max_concurrent_chats'],
            features=limits['features'],
            is_active=True
        )
        
        return SubscriptionStatusSchema(
            tier=tier_schema,
            current_usage={
                "tokens_today": daily_usage.tokens_used if daily_usage else 0,
                "messages_today": daily_usage.messages_sent if daily_usage else 0,
                "messages_this_hour": hourly_usage.messages_sent if hourly_usage else 0
            },
            limits={
                "tokens_per_day": limits['max_tokens_per_day'],
                "tokens_per_month": limits['max_tokens_per_month'],
                "messages_per_day": limits['max_messages_per_day'],
                "messages_per_hour": limits['max_messages_per_hour'],
                "concurrent_chats": limits['max_concurrent_chats']
            },
            features=limits['features']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting subscription status for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/upgrade", response_model=UpgradeSubscriptionResponse)
async def upgrade_subscription(
    request: UpgradeSubscriptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upgrade user to a new tier."""
    try:
        # Get the tier
        tier = db.query(SubscriptionTier).filter(
            and_(
                SubscriptionTier.name == request.tier_name,
                SubscriptionTier.is_active == True
            )
        ).first()
        
        if not tier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid tier name"
            )
        
        # Deactivate old subscription
        old_subscription = db.query(UserSubscription).filter(
            and_(
                UserSubscription.user_id == current_user.id,
                UserSubscription.is_active == True
            )
        ).first()
        
        if old_subscription:
            old_subscription.is_active = False
            old_subscription.updated_at = datetime.now(timezone.utc)
        
        # Create new subscription
        expires_at = None
        if tier.name != "free":
            # Set expiration for paid tiers (1 month from now)
            expires_at = datetime.now(timezone.utc) + timedelta(days=30)
        
        new_subscription = UserSubscription(
            user_id=current_user.id,
            tier_id=tier.id,
            expires_at=expires_at
        )
        
        db.add(new_subscription)
        db.commit()
        db.refresh(new_subscription)
        
        logger.info(f"User {current_user.email} upgraded to {tier.name} tier")
        
        return UpgradeSubscriptionResponse(
            success=True,
            message=f"Successfully upgraded to {tier.display_name}",
            new_tier=SubscriptionTierSchema.from_orm(tier)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error upgrading subscription for user {current_user.id}: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/tiers")
async def get_available_tiers(db: Session = Depends(get_db)):
    """Get all available subscription tiers."""
    try:
        tiers = db.query(SubscriptionTier).filter(
            SubscriptionTier.is_active == True
        ).order_by(SubscriptionTier.price_usd).all()
        
        return [SubscriptionTierSchema.from_orm(tier) for tier in tiers]
        
    except Exception as e:
        logger.error(f"Error getting subscription tiers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
