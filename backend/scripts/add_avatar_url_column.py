#!/usr/bin/env python3
"""
Add avatar_url column to users table.
This script adds the avatar_url column to the existing users table.
"""

import logging
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from core.config.config import settings

logger = logging.getLogger(__name__)

def add_avatar_url_column():
    """Add avatar_url column to users table."""
    try:
        engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
        
        with engine.connect() as conn:
            # Check if column already exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'avatar_url'
            """))
            
            if result.fetchone():
                logger.info("avatar_url column already exists in users table")
                return
            
            # Add the column
            logger.info("Adding avatar_url column to users table...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN avatar_url VARCHAR(500)
            """))
            conn.commit()
            
            logger.info("Successfully added avatar_url column to users table")
            
    except Exception as e:
        logger.error(f"Error adding avatar_url column: {e}")
        raise

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    add_avatar_url_column()
