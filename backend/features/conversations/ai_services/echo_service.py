"""Echo AI service that returns exactly what the user wrote."""

from typing import List, AsyncGenerator, Any
from .base import BaseAIService, Message


class EchoAIService(BaseAIService):
    """Echo AI service that returns exactly what the user wrote."""

    def __init__(self):
        """Initialize Echo service."""
        pass

    async def generate_stream(
        self,
        messages: List[Message],
        system_prompt: str,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Stream AI response by echoing back the last user message."""
        # Get the last user message
        for message in reversed(messages):
            if message.role == "user":
                yield message.content
                return

        # If no user message found, yield empty string
        yield ""

    def count_tokens(self, text: str) -> int:
        """Count tokens (approximate)."""
        if not text:
            return 0
        return len(text) // 4

    def format_messages_for_provider(
        self,
        messages: List[Message],
        system_prompt: str
    ) -> Any:
        """Format messages (not needed for echo service)."""
        return messages
