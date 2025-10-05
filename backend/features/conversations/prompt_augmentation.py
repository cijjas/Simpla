"""Prompt augmentation utilities for improving RAG search queries."""

from typing import Tuple
from core.utils.logging_config import get_logger
from core.clients.embedding import get_embedding
from .ai_service import get_ai_service_instance
from .ai_services.base import Message

logger = get_logger(__name__)


async def reformulate_user_question(user_question: str) -> str:
    try:
        ai_service = get_ai_service_instance()
        
        reformulation_prompt = f"""Reformula la siguiente consulta del usuario para que use lenguaje jurídico y técnico argentino, pero sin extender su significado ni agregar explicaciones.
            La salida debe ser una sola oración concisa, similar a una búsqueda textual que podría usarse para localizar una norma en una base de datos legal.

            Objetivos:
            - Sustituye términos coloquiales por vocabulario jurídico o administrativo.
            - Agrega sinónimos relevantes del ámbito legal argentino (por ejemplo: "ley", "decreto", "normativa", "reglamentación", "disposición").
            - No incluyas listas, análisis ni referencias a leyes específicas a menos que el usuario las mencione.
            - Devuelve solo la oración reformulada, sin comentarios ni explicaciones.

            Ejemplo:
            - Usuario: "qué dice la ley sobre el maltrato animal?"
            - Reformulación: "normativa argentina vigente sobre la protección y el maltrato de los animales domésticos y silvestres."

            Ahora reformula esta consulta del usuario:
            <user_question>{user_question}</user_question>"""
        
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


async def augment_user_prompt(user_question: str) -> Tuple[str, dict]:
    try:
        # Reformulate the question for better search
        reformulated_question = await reformulate_user_question(user_question)
        
        # Use the reformulated question for embedding generation
        question_for_embedding = reformulated_question if reformulated_question else user_question
        
        # Generate embedding
        embedding_result = get_embedding(question_for_embedding)
        
        if not embedding_result["success"] or not embedding_result["data"]:
            raise Exception("Failed to generate embedding")
        
        logger.info(f"Successfully generated embedding for: {question_for_embedding}")
        
        return question_for_embedding, embedding_result
        
    except Exception as e:
        logger.error(f"Error in prompt augmentation: {str(e)}")
        raise
