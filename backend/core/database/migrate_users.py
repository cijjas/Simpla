"""Migrate existing users from Prisma schema to new SQLAlchemy schema."""

import uuid
import logging
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from core.config.config import settings
from features.auth.models.user import User

logger = logging.getLogger(__name__)


def migrate_users():
    """Migrate users from existing Prisma tables to new SQLAlchemy tables."""
    engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    with SessionLocal() as db:
        try:
            # Check if old User table exists
            result = db.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'User'
                );
            """))
            
            if not result.scalar():
                logger.info("No existing User table found. Skipping migration.")
                return
            
            # Get existing users from Prisma schema
            existing_users = db.execute(text("""
                SELECT id, name, email, "emailVerified", image, "hashedPassword"
                FROM "User"
            """)).fetchall()
            
            logger.info(f"Found {len(existing_users)} existing users to migrate.")
            
            # Migrate each user
            for old_user in existing_users:
                # Check if user already exists in new table
                existing_new_user = db.query(User).filter(User.id == old_user.id).first()
                if existing_new_user:
                    logger.info(f"User {old_user.email} already migrated. Skipping.")
                    continue
                
                # Determine provider based on whether they have a password
                provider = "email" if old_user.hashedPassword else "google"
                
                # Create new user record
                new_user = User(
                    id=old_user.id,
                    email=old_user.email,
                    name=old_user.name,
                    hashed_password=old_user.hashedPassword,
                    provider=provider,
                    email_verified=bool(old_user.emailVerified),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                db.add(new_user)
                logger.info(f"Migrated user: {old_user.email}")
            
            db.commit()
            logger.info("User migration completed successfully!")
            
        except Exception as e:
            logger.error(f"Error during migration: {e}")
            db.rollback()
            raise


if __name__ == "__main__":
    migrate_users()
