#!/usr/bin/env python3
"""Migration script to add attached_file_names column to conversation_messages table."""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

async def add_attached_files_column():
    """Add attached_file_names column to conversation_messages table."""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return
    
    try:
        # Create engine
        engine = create_engine(database_url)
        
        print("✅ Connected to database")
        
        # Check if column already exists
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'conversation_messages' 
                AND column_name = 'attached_file_names'
            """))
            
            column_exists = result.fetchone()
            
            if column_exists:
                print("ℹ️  Column 'attached_file_names' already exists, skipping migration")
                return
            
            # Add the new column
            conn.execute(text("""
                ALTER TABLE conversation_messages 
                ADD COLUMN attached_file_names JSONB
            """))
            conn.commit()
            
            print("✅ Successfully added 'attached_file_names' column to 'conversation_messages' table")
        
    except Exception as e:
        print(f"❌ Failed to add column: {e}")
        raise

if __name__ == "__main__":
    import asyncio
    asyncio.run(add_attached_files_column())

