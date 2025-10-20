#!/usr/bin/env python3
"""Initialize ALL database tables."""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from core.database.base import Base
from dotenv import load_dotenv

# Import ALL models to ensure they are registered
from features.auth.auth_models import User, RefreshToken
from features.folders.folder_models import Folder, FolderNorma
from features.favorites.favorites_models import Favorite
from features.conversations.models import Conversation, Message
from features.conversations.feedback.feedback_models import MessageFeedback
from features.subscription.subscription_models import SubscriptionTier, UserSubscription, UserUsage

load_dotenv()

def init_all_tables():
    """Create all tables if they don't exist."""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        print("   Check your .env file in the backend directory")
        return False

    try:
        # Create engine
        print(f"🔌 Connecting to database...")
        engine = create_engine(database_url)

        print("✅ Connected to database")

        # Create ALL tables
        print("\n📋 Creating all tables...")
        Base.metadata.create_all(bind=engine)

        print("✅ All tables created successfully!")

        # List all created tables
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))

            tables = [row[0] for row in result]
            print(f"\n📊 Tables in database:")
            for table in tables:
                print(f"   ✓ {table}")

        # Create default subscription tier if it doesn't exist
        print("\n🎫 Creating default subscription tier...")
        with engine.connect() as conn:
            # Check if default tier exists
            result = conn.execute(text("""
                SELECT COUNT(*) FROM subscription_tiers WHERE name = 'free'
            """))
            count = result.scalar()

            if count == 0:
                # Create free tier
                conn.execute(text("""
                    INSERT INTO subscription_tiers (name, monthly_token_limit, cost_usd, is_active)
                    VALUES ('free', 100000, 0.00, true)
                """))
                conn.commit()
                print("   ✅ Created 'free' subscription tier (100,000 tokens/month)")
            else:
                print("   ℹ️  'free' subscription tier already exists")

        print("\n" + "="*60)
        print("✅ Database initialization complete!")
        print("="*60)
        print("\nYou can now start the backend server:")
        print("   python3 main.py")
        print()

        return True

    except Exception as e:
        print(f"\n❌ Failed to create tables: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = init_all_tables()
    sys.exit(0 if success else 1)
