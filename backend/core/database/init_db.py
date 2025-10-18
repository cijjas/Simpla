"""Database initialization script."""

import logging
from sqlalchemy import create_engine
from core.config.config import settings
from core.database.base import Base

# Import all models to ensure they are registered with SQLAlchemy
from features.auth.auth_models import User, RefreshToken
from features.folders.folder_models import Folder, FolderNorma
from features.chat.chat_database_models import ChatSession, Message
from features.bookmarks.bookmarks_models import Bookmark

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
