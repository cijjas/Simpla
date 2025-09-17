"""Main FastAPI application for Simpla backend."""

import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from routes.chat.router import router as chat_router
from config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Simpla Backend API",
    version="1.0.0",
    description="Backend API for Simpla - Legal AI Assistant",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router)


@app.get("/")
async def welcome():
    """Welcome endpoint."""
    return {
        "message": "Welcome to Simpla Backend API!",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Global health check endpoint."""
    missing_keys = settings.validate_required_keys()
    
    if missing_keys:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "missing_configuration": missing_keys
            }
        )
    
    return {
        "status": "healthy",
        "service": "simpla-backend",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    
    # Validate configuration on startup
    missing_keys = settings.validate_required_keys()
    if missing_keys:
        logger.error(f"Missing required configuration: {missing_keys}")
        logger.error("Please check your .env file and ensure all required API keys are set.")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info"
    )
