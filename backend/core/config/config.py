"""Configuration management for the Simpla backend."""

import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""
    
    # AI
    GEMINI_API_KEY: Optional[str] = os.getenv('GEMINI_API_KEY')
    
    # Database
    DATABASE_URL: Optional[str] = os.getenv('DATABASE_URL')
    
    # Email
    RESEND_API_KEY: Optional[str] = os.getenv('RESEND_API_KEY')
    EMAIL_FROM: Optional[str] = os.getenv('EMAIL_FROM')
    
    # Feedback
    FEEDBACK_EMAILS: Optional[str] = os.getenv('FEEDBACK_EMAILS')
    
    # Contact
    CONTACT_EMAILS: Optional[str] = os.getenv('CONTACT_EMAILS')
    
    # Frontend
    FRONTEND_SITE_URL: str = os.getenv('FRONTEND_SITE_URL', 'http://localhost:3000')
    
    # Logging
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    LOG_DATABASE_QUERIES: bool = os.getenv('LOG_DATABASE_QUERIES', 'true').lower() == 'true'
    LOG_HTTP_REQUESTS: bool = os.getenv('LOG_HTTP_REQUESTS', 'true').lower() == 'true'
    
    # Microservice Configuration
    RELATIONAL_API_HOST: str = os.getenv('RELATIONAL_API_HOST', 'http://localhost:8001')
    VECTORIAL_API_HOST: str = os.getenv('VECTORIAL_API_HOST', 'http://localhost:8001')
    EMBEDDER_API_HOST: str = os.getenv('EMBEDDER_API_HOST', 'http://localhost:8001')

    # JWT Configuration
    JWT_SECRET_KEY: str = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
    JWT_ALGORITHM: str = os.getenv('JWT_ALGORITHM', 'HS256')
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '15'))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv('REFRESH_TOKEN_EXPIRE_DAYS', '30'))
    
    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv('GOOGLE_CLIENT_SECRET')
    
    
    @classmethod
    def validate_required_keys(cls) -> list[str]:
        """Validate that all required API keys are present."""
        missing_keys = []
        
        if not cls.GEMINI_API_KEY:
            missing_keys.append('GEMINI_API_KEY')
        if not cls.DATABASE_URL:
            missing_keys.append('DATABASE_URL')
        if not cls.RESEND_API_KEY:
            missing_keys.append('RESEND_API_KEY')
        if not cls.FEEDBACK_EMAILS:
            missing_keys.append('FEEDBACK_EMAILS')
            
        return missing_keys


# Global settings instance
settings = Settings()
