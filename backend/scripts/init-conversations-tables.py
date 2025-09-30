#!/usr/bin/env python3
"""Initialize conversations tables in the database."""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from core.database.base import Base
# Import all models to ensure they are registered
from features.auth.auth_models import User, RefreshToken
from features.folders.folder_models import Folder, FolderNorma
from features.conversations.models import Conversation, ConversationMessage
from dotenv import load_dotenv

load_dotenv()

async def init_conversations_tables():
    """Create conversations tables if they don't exist."""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return
    
    try:
        # Create engine
        engine = create_engine(database_url)
        
        print("✅ Connected to database")
        
        # Create tables
        Base.metadata.create_all(bind=engine, tables=[
            Conversation.__table__,
            ConversationMessage.__table__
        ])
        
        print("✅ Conversations tables created successfully!")
        
        # Test the tables exist
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name IN ('conversations', 'conversation_messages')
                AND table_schema = 'public'
            """))
            
            tables = [row[0] for row in result]
            print(f"✅ Tables created: {tables}")
        
    except Exception as e:
        print(f"❌ Failed to create tables: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(init_conversations_tables())
