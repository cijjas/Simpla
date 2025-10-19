"""Prompt augmentation utilities for improving RAG search queries."""

from typing import Tuple, Optional, List, Dict
from core.utils.logging_config import get_logger
from core.clients.embedding import get_embedding
from .ai_service import get_ai_service_instance
from .ai_services.base import Message
from .reformulation_prompts import get_reformulation_prompt

logger = get_logger(__name__)


async def reformulate_user_question(
    user_question: str,
    context_messages: Optional[List[Dict[str, str]]] = None
) -> str:
    """
    Reformulate a user question with optional conversation context.

    Args:
        user_question: The current user question
        context_messages: Optional list of previous messages in format [{"role": "user", "content": "..."}, ...]
                         Maximum of 3 messages (últimos 3 mensajes totales)

    Returns:
        Reformulated question or special keyword (NON-LEGAL, CLARIFICATION:..., REFORMULATE_REQUEST)
    """
    try:
        ai_service = get_ai_service_instance()

        # Build context string from messages
        context_str = ""
        if context_messages and len(context_messages) > 0:
            context_lines = []
            for msg in context_messages:
                role = msg.get("role", "unknown")
                content = msg.get("content", "")
                context_lines.append(f"{role}: {content}")
            context_str = "\n".join(context_lines)
        else:
            context_str = "(vacío)"

        # Get the reformulation prompt with the user question and context injected
        reformulation_prompt = get_reformulation_prompt("default").format(
            user_question=user_question,
            context=context_str
        )

        # Create a message for the AI service
        reformulation_messages = [Message(role="user", content=reformulation_prompt)]

        # Collect the reformulated question from the AI service
        reformulated_question = ""
        async for chunk in ai_service.generate_stream(reformulation_messages, system_prompt=""):
            reformulated_question += chunk

        reformulated = reformulated_question.strip()

        logger.info(f"Original question: {user_question}")
        logger.info(f"Context: {context_str}")
        logger.info(f"Reformulated question: {reformulated}")

        return reformulated if reformulated else user_question

    except Exception as e:
        logger.error(f"Error reformulating question: {str(e)}")
        return user_question

