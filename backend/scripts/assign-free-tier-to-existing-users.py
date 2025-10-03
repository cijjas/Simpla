#!/usr/bin/env python3
"""
Script to assign free tier to existing users who don't have a subscription.
"""

import sys
import os
import logging
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from core.database.base import SessionLocal
from features.subscription.subscription_models import SubscriptionTier, UserSubscription
from features.auth.auth_models import User
from features.conversations.models import Conversation  # Import to resolve relationship
from sqlalchemy import and_

def assign_free_tier_to_users():
    """Assign free tier to users who don't have an active subscription."""
    db = SessionLocal()
    try:
        # Get the free tier
        free_tier = db.query(SubscriptionTier).filter(SubscriptionTier.name == "free").first()
        
        if not free_tier:
            print("❌ Free tier not found!")
            return
        
        print(f"✅ Found free tier: {free_tier.display_name}")
        
        # Find users without active subscriptions
        users_without_subscription = db.query(User).outerjoin(UserSubscription).filter(
            UserSubscription.id.is_(None)
        ).all()
        
        print(f"Found {len(users_without_subscription)} users without subscriptions")
        
        if not users_without_subscription:
            print("✅ All users already have subscriptions")
            return
        
        # Assign free tier to users without subscriptions
        for user in users_without_subscription:
            subscription = UserSubscription(
                user_id=user.id,
                tier_id=free_tier.id,
                expires_at=None  # Free tier never expires
            )
            db.add(subscription)
            print(f"✅ Assigned free tier to user: {user.email}")
        
        db.commit()
        print(f"✅ Successfully assigned free tier to {len(users_without_subscription)} users")
        
    except Exception as e:
        print(f"❌ Error assigning free tier: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def main():
    """Main function."""
    print("Starting free tier assignment to existing users...")
    
    try:
        assign_free_tier_to_users()
        print("🎉 Free tier assignment completed successfully!")
        
    except Exception as e:
        print(f"❌ Free tier assignment failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
