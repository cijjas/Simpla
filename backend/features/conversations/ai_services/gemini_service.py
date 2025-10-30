"""Google Gemini AI service implementation."""

import os
import asyncio
import base64
from typing import List, AsyncGenerator, Dict, Any
import google.generativeai as genai
from core.utils.logging_config import get_logger
from .base import BaseAIService, Message, FilePart

logger = get_logger(__name__)


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
    ) -> List[Dict[str, Any]]:
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
                parts = []
                
                # Add file parts first if any
                if message.files:
                    for file_part in message.files:
                        parts.append({
                            "inline_data": {
                                "mime_type": file_part.mime_type,
                                "data": base64.b64encode(file_part.data).decode('utf-8')
                            }
                        })
                
                # Add text content if present
                if message.content:
                    parts.append(message.content)
                
                # Only add message if there are parts
                if parts:
                    formatted_messages.append({
                        "role": "user",
                        "parts": parts
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

            # Get the last user message - it could have multiple parts (files + text)
            last_message = formatted_messages[-1] if formatted_messages else {"parts": []}
            user_parts = last_message.get("parts", [])

            # Stream response - send all parts together
            response = await asyncio.to_thread(
                chat.send_message,
                user_parts if user_parts else [""],
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
