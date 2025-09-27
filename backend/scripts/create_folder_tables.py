#!/usr/bin/env python3
"""
Script to create folder tables in the database.
Run this script to add the folder functionality to your existing database.
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.config.config import settings
from core.utils.logging_config import get_logger

logger = get_logger(__name__)

def create_folder_tables():
    """Create folder tables in the database."""
    
    # Create database engine
    engine = create_engine(settings.DATABASE_URL)
    
    try:
        with engine.connect() as connection:
            # Start transaction
            trans = connection.begin()
            
            try:
                # Create folders table
                folders_table_sql = """
                CREATE TABLE IF NOT EXISTS folders (
                    id VARCHAR PRIMARY KEY,
                    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    parent_folder_id VARCHAR REFERENCES folders(id) ON DELETE CASCADE,
                    level INTEGER NOT NULL DEFAULT 0 CHECK (level >= 0 AND level <= 2),
                    color VARCHAR(7) DEFAULT '#3B82F6',
                    icon VARCHAR(50) DEFAULT 'folder',
                    order_index INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );
                """
                
                connection.execute(text(folders_table_sql))
                logger.info("Created folders table")
                
                # Create folder_normas table
                folder_normas_table_sql = """
                CREATE TABLE IF NOT EXISTS folder_normas (
                    id VARCHAR PRIMARY KEY,
                    folder_id VARCHAR NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
                    norma_id INTEGER NOT NULL REFERENCES normas_structured(id) ON DELETE CASCADE,
                    added_by VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    added_at TIMESTAMP DEFAULT NOW(),
                    order_index INTEGER DEFAULT 0,
                    notes TEXT,
                    UNIQUE(folder_id, norma_id)
                );
                """
                
                connection.execute(text(folder_normas_table_sql))
                logger.info("Created folder_normas table")
                
                # Create indexes for better performance
                indexes_sql = [
                    "CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);",
                    "CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_folder_id);",
                    "CREATE INDEX IF NOT EXISTS idx_folders_level ON folders(level);",
                    "CREATE INDEX IF NOT EXISTS idx_folder_normas_folder_id ON folder_normas(folder_id);",
                    "CREATE INDEX IF NOT EXISTS idx_folder_normas_norma_id ON folder_normas(norma_id);",
                    "CREATE INDEX IF NOT EXISTS idx_folder_normas_added_by ON folder_normas(added_by);",
                ]
                
                for index_sql in indexes_sql:
                    connection.execute(text(index_sql))
                
                logger.info("Created indexes")
                
                # Commit transaction
                trans.commit()
                logger.info("Successfully created folder tables and indexes")
                
            except Exception as e:
                trans.rollback()
                raise e
                
    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise

if __name__ == "__main__":
    try:
        create_folder_tables()
        print("✅ Folder tables created successfully!")
        print("You can now use the folder functionality in your application.")
    except Exception as e:
        print(f"❌ Error creating folder tables: {e}")
        sys.exit(1)
