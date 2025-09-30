"""AI service for handling different AI providers."""

import os
import asyncio
from abc import ABC, abstractmethod
from typing import List, AsyncGenerator, Dict, Any, Optional
import google.generativeai as genai
from core.utils.logging_config import get_logger

logger = get_logger(__name__)


class Message:
    """Message class for AI service compatibility."""
    
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content


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


class GeminiAIService(BaseAIService):
    """Google Gemini implementation."""
    
    def __init__(self):
        """Initialize Gemini service."""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=api_key)
        
        # Use gemini-2.0-flash-exp if available, fallback to gemini-1.5-pro
        try:
            self.model = genai.GenerativeModel("gemini-2.0-flash-exp")
            logger.info("Using Gemini 2.0 Flash Experimental model")
        except Exception:
            self.model = genai.GenerativeModel("gemini-1.5-pro")
            logger.info("Using Gemini 1.5 Pro model")
    
    def format_messages_for_provider(
        self, 
        messages: List[Message], 
        system_prompt: str
    ) -> List[Dict[str, str]]:
        """Format messages for Gemini API."""
        formatted_messages = []
        
        # Add system prompt as first message if provided
        if system_prompt:
            formatted_messages.append({
                "role": "user",
                "parts": [f"System: {system_prompt}"]
            })
            formatted_messages.append({
                "role": "model", 
                "parts": ["Entendido. Soy un asistente legal especializado y estoy listo para ayudarte."]
            })
        
        # Convert messages to Gemini format
        for message in messages:
            if message.role == "system":
                # System messages are handled above
                continue
            elif message.role == "user":
                formatted_messages.append({
                    "role": "user",
                    "parts": [message.content]
                })
            elif message.role == "assistant":
                formatted_messages.append({
                    "role": "model",
                    "parts": [message.content]
                })
        
        return formatted_messages
    
    async def generate_stream(
        self,
        messages: List[Message],
        system_prompt: str,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Stream AI response using Gemini API."""
        try:
            # Format messages for Gemini
            formatted_messages = self.format_messages_for_provider(messages, system_prompt)
            
            # Start chat session
            chat = self.model.start_chat(history=formatted_messages[:-1] if len(formatted_messages) > 1 else [])
            
            # Get the last user message
            last_message = formatted_messages[-1] if formatted_messages else {"parts": [""]}
            user_content = last_message.get("parts", [""])[0]
            
            # Stream response
            response = await asyncio.to_thread(
                chat.send_message,
                user_content,
                stream=True
            )
            
            # Yield chunks as they come
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            logger.error(f"Error in Gemini streaming: {str(e)}")
            yield f"Error: No se pudo generar la respuesta. {str(e)}"
    
    def count_tokens(self, text: str) -> int:
        """Count tokens for Gemini (approximate)."""
        # Gemini uses a different tokenization, this is an approximation
        # For more accurate counting, you could use the Gemini API's count_tokens method
        if not text:
            return 0
        
        # Rough approximation: 1 token ≈ 4 characters for Spanish text
        return len(text) // 4


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


def get_ai_service() -> BaseAIService:
    """Factory function to get AI service based on configuration."""
    provider = os.getenv("AI_PROVIDER", "gemini").lower()
    
    if provider == "gemini":
        return GeminiAIService()
    elif provider == "claude":
        return ClaudeAIService()
    elif provider == "openai":
        return OpenAIService()
    else:
        raise ValueError(f"Unknown AI provider: {provider}. Supported providers: gemini, claude, openai")


# Global AI service instance
_ai_service: Optional[BaseAIService] = None


def get_ai_service_instance() -> BaseAIService:
    """Get or create AI service instance (singleton pattern)."""
    global _ai_service
    if _ai_service is None:
        _ai_service = get_ai_service()
    return _ai_service

