"""Prompt augmentation utilities for improving RAG search queries."""

from typing import Tuple
from core.utils.logging_config import get_logger
from core.clients.embedding import get_embedding
from .ai_service import get_ai_service_instance
from .ai_services.base import Message
from .reformulation_prompts import get_reformulation_prompt

logger = get_logger(__name__)


async def reformulate_user_question(user_question: str) -> str:
    try:
        ai_service = get_ai_service_instance()
        
        # Get the reformulation prompt with the user question already injected
        reformulation_prompt = get_reformulation_prompt("default").format(user_question=user_question)
        
        # Create a message for the AI service
        reformulation_messages = [Message(role="user", content=reformulation_prompt)]
        
        # Collect the reformulated question from the AI service
        reformulated_question = ""
        async for chunk in ai_service.generate_stream(reformulation_messages, system_prompt=""):
            reformulated_question += chunk
        
        reformulated = reformulated_question.strip()
        
        logger.info(f"Original question: {user_question}")
        logger.info(f"Reformulated question: {reformulated}")
        
        return reformulated if reformulated else user_question
        
    except Exception as e:
        logger.error(f"Error reformulating question: {str(e)}")
        return user_question

