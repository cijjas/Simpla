"""AI service for handling different AI providers."""

import os
from typing import Optional
from .ai_services import (
    BaseAIService,
    Message,
    GeminiAIService,
    EchoAIService,
    ClaudeAIService,
    OpenAIService,
)


def get_ai_service() -> BaseAIService:
    """Factory function to get AI service based on configuration."""
    provider = os.getenv("AI_PROVIDER", "gemini").lower()

    if provider == "gemini":
        return GeminiAIService()
    elif provider == "claude":
        return ClaudeAIService()
    elif provider == "openai":
        return OpenAIService()
    elif provider == "echo":
        return EchoAIService()
    else:
        raise ValueError(f"Unknown AI provider: {provider}. Supported providers: gemini, echo, claude, openai")


# Global AI service instance
_ai_service: Optional[BaseAIService] = None


def get_ai_service_instance() -> BaseAIService:
    """Get or create AI service instance (singleton pattern)."""
    global _ai_service
    if _ai_service is None:
        _ai_service = get_ai_service()
    return _ai_service

