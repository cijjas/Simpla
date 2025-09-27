"""Main FastAPI application for Simpla backend."""

import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Import feature routers
from features.auth.routes.auth_router import router as auth_router
from features.chat.routes.router import router as chat_router
from features.feedback.routes.router import router as feedback_router
from features.infoleg.routes.norma_router import router as norma_router
from features.folders.routes.folder_router import router as folder_router

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
app.include_router(chat_router, prefix="/api")
app.include_router(feedback_router, prefix="/api")
app.include_router(norma_router, prefix="/api")
app.include_router(folder_router, prefix="/api")


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
        app_logger.info("Configuration validated successfully")
    
    app_logger.info(f"Logging level: {settings.LOG_LEVEL}")
    app_logger.info(f"Database logging: {'enabled' if settings.LOG_DATABASE_QUERIES else 'disabled'}")
    app_logger.info(f"HTTP logging: {'enabled' if settings.LOG_HTTP_REQUESTS else 'disabled'}")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info",
        access_log=False  # We're using our custom logging middleware
    )
