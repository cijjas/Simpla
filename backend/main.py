"""Main FastAPI application for Simpla backend."""

import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Import all models to ensure they are registered with SQLAlchemy
from features.auth.auth_models import User, RefreshToken
from features.folders.folder_models import Folder, FolderNorma
from features.favorites.favorites_models import Favorite
# from features.chat.chat_database_models import ChatSession, Message  # Deprecated
from features.conversations.models import Conversation, Message
from features.conversations.feedback.feedback_models import MessageFeedback
from features.subscription.subscription_models import SubscriptionTier, UserSubscription, UserUsage

# Import feature routers
from features.auth.auth_routes import router as auth_router
from features.chat.chat_routes import router as chat_router  # Re-enabled for rate limiting
from features.feedback.feedback_routes import router as feedback_router
from features.contact.contact_routes import router as contact_router
from features.folders.folder_routes import router as folder_router
from features.favorites.favorites_routes import router as favorites_router
from features.conversations.router import router as conversations_router
from features.conversations.feedback.feedback_routes import router as message_feedback_router
from features.subscription.subscription_routes import router as subscription_router

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include feature routers
app.include_router(auth_router, prefix="/api")
app.include_router(chat_router, prefix="/api")  # Re-enabled for rate limiting
app.include_router(feedback_router, prefix="/api")
app.include_router(contact_router, prefix="/api")
app.include_router(folder_router, prefix="/api")
app.include_router(conversations_router, prefix="/api")
app.include_router(message_feedback_router, prefix="/api")
app.include_router(favorites_router, prefix="/api")
app.include_router(subscription_router, prefix="/api")


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
