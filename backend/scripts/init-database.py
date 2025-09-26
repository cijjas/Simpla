#!/usr/bin/env python3
"""
Database initialization script for deployment.
This script creates all necessary tables for the Simpla application.
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

def main():
    """Initialize the database with all required tables."""
    # Set up logging
    setup_logging()
    logger = logging.getLogger(__name__)
    
    logger.info("Starting database initialization...")
    
    # Validate database URL
    if not settings.DATABASE_URL:
        logger.error("DATABASE_URL environment variable is not set!")
        sys.exit(1)
    
    logger.info(f"Using database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'local'}")
    
    try:
        # Create all tables
        create_tables()
        logger.info("✅ Database initialization completed successfully!")
        logger.info("Created tables:")
        logger.info("  - users (user accounts and authentication)")
        logger.info("  - refresh_tokens (JWT token management)")
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
