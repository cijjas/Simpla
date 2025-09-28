"""Base model configuration with enhanced logging."""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from core.config.config import settings
from core.utils.logging_config import get_logger
from core.utils.db_logging import setup_database_event_listeners

logger = get_logger(__name__)

# Create database engine with minimal SQL logging
engine = create_engine(
    settings.DATABASE_URL, 
    pool_pre_ping=True,
    echo=settings.LOG_DATABASE_QUERIES,  # Enable SQL logging if configured
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600
)

# Set up database event listeners for query logging (disabled for minimal logging)
# setup_database_event_listeners(engine)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)

# Create base class for models
Base = declarative_base()

# logger.info("Database engine initialized")  # Disabled for minimal logging


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()
