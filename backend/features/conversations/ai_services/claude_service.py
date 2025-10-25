"""Anthropic Claude AI service implementation."""

from typing import List, AsyncGenerator, Any
from .base import BaseAIService, Message


class ClaudeAIService(BaseAIService):
    """Anthropic Claude implementation (placeholder for future use)."""

    def __init__(self):
        """Initialize Claude service."""
        raise NotImplementedError("Claude service not yet implemented")

    async def generate_stream(
        self,
        messages: List[Message],
        system_prompt: str,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Stream AI response using Claude API."""
        raise NotImplementedError("Claude service not yet implemented")

    def count_tokens(self, text: str) -> int:
        """Count tokens for Claude."""
        raise NotImplementedError("Claude service not yet implemented")

    def format_messages_for_provider(
        self,
        messages: List[Message],
        system_prompt: str
    ) -> Any:
        """Format messages for Claude API."""
        raise NotImplementedError("Claude service not yet implemented")
