#!/usr/bin/env python3
"""Script to recreate the database with UUID schema."""

import os
import sys
import logging
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from core.config.config import settings
from core.database.base import Base

# Import all models to ensure they are registered with SQLAlchemy
from features.auth.models.user import User, RefreshToken
from features.folders.models.folder import Folder, FolderNorma
from features.chat.models.database_models import ChatSession, Message

logger = logging.getLogger(__name__)

def drop_all_tables():
    """Drop all existing tables."""
    try:
        engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
        
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        logger.info("All existing tables dropped successfully")
        
    except Exception as e:
        logger.error(f"Error dropping tables: {e}")
        raise

def create_all_tables():
    """Create all database tables with new UUID schema."""
    try:
        engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("All tables created successfully with UUID schema")
        
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        raise

def main():
    """Main function to recreate the database."""
    logging.basicConfig(level=logging.INFO)
    
    logger.info("Starting database recreation with UUID schema...")
    
    try:
        # Drop all existing tables
        logger.info("Dropping existing tables...")
        drop_all_tables()
        
        # Create all tables with new schema
        logger.info("Creating tables with UUID schema...")
        create_all_tables()
        
        logger.info("Database recreation completed successfully!")
        logger.info("All tables now use UUID primary keys and include soft delete support.")
        
    except Exception as e:
        logger.error(f"Database recreation failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
