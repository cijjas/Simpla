"""OpenAI AI service implementation."""

from typing import List, AsyncGenerator, Any
from .base import BaseAIService, Message


class OpenAIService(BaseAIService):
    """OpenAI implementation (placeholder for future use)."""

    def __init__(self):
        """Initialize OpenAI service."""
        raise NotImplementedError("OpenAI service not yet implemented")

    async def generate_stream(
        self,
        messages: List[Message],
        system_prompt: str,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Stream AI response using OpenAI API."""
        raise NotImplementedError("OpenAI service not yet implemented")

    def count_tokens(self, text: str) -> int:
        """Count tokens for OpenAI."""
        raise NotImplementedError("OpenAI service not yet implemented")

    def format_messages_for_provider(
        self,
        messages: List[Message],
        system_prompt: str
    ) -> Any:
        """Format messages for OpenAI API."""
        raise NotImplementedError("OpenAI service not yet implemented")
