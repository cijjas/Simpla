"""Main FastAPI application for Simpla backend."""

import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Import all models to ensure they are registered with SQLAlchemy
from features.auth.auth_models import User, RefreshToken
from features.folders.folder_models import Folder, FolderNorma
from features.bookmarks.bookmarks_models import Bookmark
# from features.chat.chat_database_models import ChatSession, Message  # Deprecated
from features.conversations.models import Conversation, Message
from features.conversations.feedback.feedback_models import MessageFeedback
from features.subscription.subscription_models import SubscriptionTier, UserSubscription, UserUsage
from features.digest.digest_models import DigestWeekly, DigestUserPreferences

# Import feature routers
from features.auth.auth_routes import router as auth_router
from features.feedback.feedback_routes import router as feedback_router
from features.contact.contact_routes import router as contact_router
from features.folders.folder_routes import router as folder_router
from features.bookmarks.bookmarks_routes import router as bookmarks_router
from features.conversations.router import router as conversations_router
from features.conversations.feedback.feedback_routes import router as message_feedback_router
from features.subscription.subscription_routes import router as subscription_router
from features.normas.normas_routes import router as normas_router
from features.norma_chat.routes import router as norma_chat_router
from features.digest.digest_routes import router as digest_router
from features.notifications.notifications_routes import router as notifications_router

# Import core configuration and logging
from core.config.config import settings
from core.utils.logging_config import setup_logging, get_logger
from core.middleware.logging_middleware import LoggingMiddleware

# Set up colored logging
logger = setup_logging()
app_logger = get_logger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Simpla Backend API",
    version="1.0.0",
    description="Backend API for Simpla - Legal AI Assistant",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add logging middleware (must be first)
if settings.LOG_HTTP_REQUESTS:
    app.add_middleware(LoggingMiddleware)

# Add CORS middleware
# Get allowed origins from settings, defaulting to localhost for development
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]

# Add common localhost variations for development
if any("localhost" in origin for origin in allowed_origins):
    dev_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
    for dev_origin in dev_origins:
        if dev_origin not in allowed_origins:
            allowed_origins.append(dev_origin)

app_logger.info(f"CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include feature routers
app.include_router(auth_router, prefix="/api")
app.include_router(feedback_router, prefix="/api")
app.include_router(contact_router, prefix="/api")
app.include_router(folder_router, prefix="/api")
app.include_router(conversations_router, prefix="/api")
app.include_router(message_feedback_router, prefix="/api")
app.include_router(bookmarks_router, prefix="/api")
app.include_router(subscription_router, prefix="/api")
app.include_router(normas_router, prefix="/api")
app.include_router(norma_chat_router, prefix="/api")
app.include_router(digest_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")


@app.get("/api/")
async def welcome():
    """Welcome endpoint."""
    app_logger.info("Welcome endpoint accessed")
    return {
        "message": "Welcome to Simpla Backend API!",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/api/health")
async def health_check():
    """Global health check endpoint."""
    app_logger.info("Health check requested")
    missing_keys = settings.validate_required_keys()
    
    if missing_keys:
        app_logger.error(f"Health check failed: missing keys {missing_keys}")
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "missing_configuration": missing_keys
            }
        )
    
    app_logger.info("Health check passed")
    return {
        "status": "healthy",
        "service": "simpla-backend",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    
    app_logger.info("Starting Simpla Backend API...")
    
    # Validate configuration on startup
    missing_keys = settings.validate_required_keys()
    if missing_keys:
        app_logger.error(f"Missing required configuration: {missing_keys}")
        app_logger.error("Please check your .env file and ensure all required API keys are set.")
    else:
        pass  # Configuration validated successfully (disabled logging)
    
    # Disabled startup logging for minimal output
    # app_logger.info(f"Logging level: {settings.LOG_LEVEL}")
    # app_logger.info(f"Database logging: {'enabled' if settings.LOG_DATABASE_QUERIES else 'disabled'}")
    # app_logger.info(f"HTTP logging: {'enabled' if settings.LOG_HTTP_REQUESTS else 'disabled'}")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info",
        access_log=False  # We're using our custom logging middleware
    )
