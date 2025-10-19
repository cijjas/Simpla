"""Rate limiting service for subscription tiers."""

import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from features.subscription.subscription_models import (
    SubscriptionTier, 
    UserSubscription, 
    UserUsage
)
from features.subscription.subscription_schemas import RateLimitCheckSchema

logger = logging.getLogger(__name__)


class RateLimitService:
    """Service for checking and enforcing rate limits."""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def get_user_limits(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user's current subscription tier and limits.
        
        Args:
            user_id: User ID
            
        Returns:
            Dictionary with tier info and effective limits, or None if no active subscription
        """
        try:
            # Get active subscription with tier info
            subscription = self.db.query(UserSubscription).join(SubscriptionTier).filter(
                and_(
                    UserSubscription.user_id == user_id,
                    UserSubscription.is_active == True,
                    or_(
                        UserSubscription.expires_at.is_(None),
                        UserSubscription.expires_at > datetime.now(timezone.utc)
                    )
                )
            ).first()
            
            if not subscription:
                return None
            
            tier = subscription.tier
            
            # Calculate effective limits (custom limits override tier limits)
            effective_limits = {
                'tier_id': tier.id,
                'tier_name': tier.name,
                'display_name': tier.display_name,
                'max_tokens_per_day': tier.max_tokens_per_day,
                'max_tokens_per_month': tier.max_tokens_per_month,
                'max_messages_per_day': tier.max_messages_per_day,
                'max_messages_per_hour': tier.max_messages_per_hour,
                'max_concurrent_chats': tier.max_concurrent_chats,
                'features': tier.features or {},
                'custom_limits': subscription.custom_limits or {}
            }
            
            # Apply custom limits if they exist
            if subscription.custom_limits:
                for key, value in subscription.custom_limits.items():
                    if key in effective_limits:
                        effective_limits[key] = value
            
            return effective_limits
            
        except Exception as e:
            logger.error(f"Error getting user limits for user {user_id}: {e}")
            return None
    
    async def get_current_usage(self, user_id: str, period_type: str) -> Optional[UserUsage]:
        """
        Get current usage for a specific period.
        
        Args:
            user_id: User ID
            period_type: 'hour', 'day', or 'month'
            
        Returns:
            UserUsage record or None if no usage recorded
        """
        try:
            period_start = self._get_period_start(period_type)
            
            usage = self.db.query(UserUsage).filter(
                and_(
                    UserUsage.user_id == user_id,
                    UserUsage.period_type == period_type,
                    UserUsage.period_start == period_start
                )
            ).first()
            
            return usage
            
        except Exception as e:
            logger.error(f"Error getting current usage for user {user_id}, period {period_type}: {e}")
            return None
    
    async def check_rate_limit(self, user_id: str, tokens_needed: int) -> RateLimitCheckSchema:
        """
        Check if user can make a request (MAIN FUNCTION).
        
        Args:
            user_id: User ID
            tokens_needed: Estimated tokens needed for the request
            
        Returns:
            RateLimitCheckSchema with rate limit status
        """
        try:
            # 1. Get user's limits
            limits = await self.get_user_limits(user_id)
            logger.info(f"Got limits for user {user_id}: {limits}")
            
            if not limits:
                logger.warning(f"No limits found for user {user_id}")
                return RateLimitCheckSchema(
                    allowed=False,
                    current_usage=0,
                    limit=0,
                    period_type="day",
                    reset_at=self._get_period_end("day"),
                    message="No active subscription found"
                )
            
            # 2. Check daily token limit
            daily_usage = await self.get_current_usage(user_id, "day")
            current_daily_tokens = daily_usage.tokens_used if daily_usage else 0
            daily_limit = limits['max_tokens_per_day']
            
            # NULL means unlimited
            if daily_limit is not None and (current_daily_tokens + tokens_needed) > daily_limit:
                return RateLimitCheckSchema(
                    allowed=False,
                    current_usage=current_daily_tokens,
                    limit=daily_limit,
                    period_type="day",
                    reset_at=self._get_period_end("day"),
                    message=f"Daily token limit of {daily_limit} exceeded"
                )
            
            # 3. Check hourly message limit
            hourly_usage = await self.get_current_usage(user_id, "hour")
            current_hourly_messages = hourly_usage.messages_sent if hourly_usage else 0
            hourly_limit = limits['max_messages_per_hour']
            
            if hourly_limit is not None and (current_hourly_messages + 1) > hourly_limit:
                return RateLimitCheckSchema(
                    allowed=False,
                    current_usage=current_hourly_messages,
                    limit=hourly_limit,
                    period_type="hour",
                    reset_at=self._get_period_end("hour"),
                    message=f"Hourly message limit of {hourly_limit} exceeded"
                )
            
            # 4. Check daily message limit
            current_daily_messages = daily_usage.messages_sent if daily_usage else 0
            daily_message_limit = limits['max_messages_per_day']
            
            if daily_message_limit is not None and (current_daily_messages + 1) > daily_message_limit:
                return RateLimitCheckSchema(
                    allowed=False,
                    current_usage=current_daily_messages,
                    limit=daily_message_limit,
                    period_type="day",
                    reset_at=self._get_period_end("day"),
                    message=f"Daily message limit of {daily_message_limit} exceeded"
                )
            
            # All checks passed
            return RateLimitCheckSchema(
                allowed=True,
                current_usage=current_daily_tokens,
                limit=daily_limit,  # None means unlimited
                period_type="day",
                reset_at=self._get_period_end("day"),
                message="Request allowed"
            )
            
        except Exception as e:
            logger.error(f"Error checking rate limit for user {user_id}: {e}")
            return RateLimitCheckSchema(
                allowed=False,
                current_usage=0,
                limit=0,
                period_type="day",
                reset_at=self._get_period_end("day"),
                message="Rate limit check failed"
            )
    
    async def record_usage(self, user_id: str, tokens_used: int) -> bool:
        """
        Record usage after a successful request.
        
        Args:
            user_id: User ID
            tokens_used: Actual tokens used
            
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info(f"Starting to record usage for user {user_id}: {tokens_used} tokens")
            period_types = ['hour', 'day', 'month']
            
            for period_type in period_types:
                period_start = self._get_period_start(period_type)
                period_end = self._get_period_end(period_type)
                
                # Try to get existing usage record
                usage = self.db.query(UserUsage).filter(
                    and_(
                        UserUsage.user_id == user_id,
                        UserUsage.period_start == period_start,
                        UserUsage.period_type == period_type
                    )
                ).first()
                
                if usage:
                    # Update existing record
                    usage.tokens_used += tokens_used
                    usage.messages_sent += 1
                    usage.updated_at = datetime.now(timezone.utc)
                else:
                    # Create new record
                    usage = UserUsage(
                        user_id=user_id,
                        period_start=period_start,
                        period_end=period_end,
                        period_type=period_type,
                        tokens_used=tokens_used,
                        messages_sent=1
                    )
                    self.db.add(usage)
            
            self.db.commit()
            logger.info(f"Successfully recorded usage for user {user_id}: {tokens_used} tokens, 1 message")
            return True
            
        except Exception as e:
            logger.error(f"Error recording usage for user {user_id}: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            self.db.rollback()
            return False
    
    def _get_period_start(self, period_type: str) -> datetime:
        """Get the start of the current period."""
        now = datetime.now(timezone.utc)
        
        if period_type == "hour":
            return now.replace(minute=0, second=0, microsecond=0)
        elif period_type == "day":
            return now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period_type == "month":
            return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            raise ValueError(f"Invalid period type: {period_type}")
    
    def _get_period_end(self, period_type: str) -> datetime:
        """Get the end of the current period."""
        start = self._get_period_start(period_type)
        
        if period_type == "hour":
            from datetime import timedelta
            return start + timedelta(hours=1)
        elif period_type == "day":
            from datetime import timedelta
            return start + timedelta(days=1)
        elif period_type == "month":
            if start.month == 12:
                return start.replace(year=start.year + 1, month=1)
            else:
                return start.replace(month=start.month + 1)
        else:
            raise ValueError(f"Invalid period type: {period_type}")

