#!/usr/bin/env python3
"""
Database migration script for subscription system.
This script creates the subscription tables and initializes default tiers.
"""

import sys
import os
import logging
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from core.database.init_db import create_tables
from core.config.config import settings
from core.utils.logging_config import setup_logging
from core.database.base import SessionLocal
from features.subscription.subscription_models import SubscriptionTier

def create_default_tiers():
    """Create default subscription tiers."""
    db = SessionLocal()
    try:
        # Check if tiers already exist
        existing_tiers = db.query(SubscriptionTier).count()
        if existing_tiers > 0:
            print("✅ Subscription tiers already exist, skipping creation")
            return
        
        # Create default tiers
        tiers = [
            SubscriptionTier(
                name="free",
                display_name="Free Plan",
                price_usd=0,
                max_tokens_per_day=1000,
                max_tokens_per_month=10000,
                max_messages_per_day=10,
                max_messages_per_hour=5,
                max_concurrent_chats=1,
                features={
                    "basic_chat": True,
                    "document_search": True,
                    "basic_support": True,
                    "priority_support": False,
                    "advanced_features": False,
                    "api_access": False
                }
            ),
            SubscriptionTier(
                name="pro",
                display_name="Pro Plan",
                price_usd=2900,  # $29.00 in cents
                max_tokens_per_day=10000,
                max_tokens_per_month=100000,
                max_messages_per_day=100,
                max_messages_per_hour=20,
                max_concurrent_chats=5,
                features={
                    "basic_chat": True,
                    "document_search": True,
                    "basic_support": True,
                    "priority_support": True,
                    "advanced_features": True,
                    "api_access": False
                }
            ),
            SubscriptionTier(
                name="enterprise",
                display_name="Enterprise Plan",
                price_usd=9900,  # $99.00 in cents
                max_tokens_per_day=None,  # Unlimited
                max_tokens_per_month=None,  # Unlimited
                max_messages_per_day=None,  # Unlimited
                max_messages_per_hour=None,  # Unlimited
                max_concurrent_chats=None,  # Unlimited
                features={
                    "basic_chat": True,
                    "document_search": True,
                    "basic_support": True,
                    "priority_support": True,
                    "advanced_features": True,
                    "api_access": True,
                    "custom_limits": True,
                    "dedicated_support": True
                }
            )
        ]
        
        for tier in tiers:
            db.add(tier)
        
        db.commit()
        print("✅ Default subscription tiers created successfully!")
        print("   - Free Plan (1000 tokens/day, 10 messages/day)")
        print("   - Pro Plan (10000 tokens/day, 100 messages/day)")
        print("   - Enterprise Plan (Unlimited)")
        
    except Exception as e:
        print(f"❌ Error creating subscription tiers: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def main():
    """Initialize subscription tables and default data."""
    # Set up logging
    setup_logging()
    logger = logging.getLogger(__name__)
    
    print("Starting subscription system initialization...")
    
    # Validate database URL
    if not settings.DATABASE_URL:
        print("❌ DATABASE_URL environment variable is not set!")
        sys.exit(1)
    
    print(f"Using database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'local'}")
    
    try:
        # Create all tables (including new subscription tables)
        create_tables()
        print("✅ Subscription tables created successfully!")
        print("Created tables:")
        print("  - subscription_tiers (subscription plans)")
        print("  - user_subscriptions (user tier assignments)")
        print("  - user_usage (usage tracking for rate limiting)")
        
        # Create default tiers
        create_default_tiers()
        
        print("\n🎉 Subscription system initialization completed successfully!")
        print("\nNext steps:")
        print("1. Update your main.py to include subscription routes")
        print("2. Test the /api/subscription/status endpoint")
        print("3. Test rate limiting on chat endpoints")
        
    except Exception as e:
        print(f"❌ Subscription system initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

