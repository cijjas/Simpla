"""Database initialization script."""

import logging
from sqlalchemy import create_engine
from core.config.config import settings
from core.database.base import Base
from features.auth.models.user import User, RefreshToken

logger = logging.getLogger(__name__)


def create_tables():
    """Create all database tables."""
    try:
        engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise


if __name__ == "__main__":
    create_tables()
