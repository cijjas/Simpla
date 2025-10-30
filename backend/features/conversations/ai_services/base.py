"""Base AI service interface."""

from abc import ABC, abstractmethod
from typing import List, AsyncGenerator, Any, Optional, Dict


class FilePart:
    """Represents a file part in a message."""
    
    def __init__(self, mime_type: str, data: bytes):
        self.mime_type = mime_type
        self.data = data  # bytes


class Message:
    """Message class for AI service compatibility."""

    def __init__(self, role: str, content: str, files: Optional[List[FilePart]] = None):
        self.role = role
        self.content = content
        self.files = files or []


class BaseAIService(ABC):
    """Abstract base class for all AI providers."""

    @abstractmethod
    async def generate_stream(
        self,
        messages: List[Message],
        system_prompt: str,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Stream AI response chunks."""
        pass

    @abstractmethod
    def count_tokens(self, text: str) -> int:
        """Count tokens for cost tracking."""
        pass

    @abstractmethod
    def format_messages_for_provider(
        self,
        messages: List[Message],
        system_prompt: str
    ) -> Any:
        """Format messages for the specific AI provider."""
        pass
