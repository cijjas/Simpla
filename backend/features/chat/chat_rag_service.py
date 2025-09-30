"""RAG (Retrieval-Augmented Generation) service."""

import logging
from typing import List
import google.generativeai as genai
from core.config.config import settings
from features.chat.config import LEGAL_PROMPT_TEMPLATE, NO_CONTEXT_RESPONSE, GEMINI_MODEL_NAME
from features.chat.chat_embedding_service import EmbeddingService
from features.chat.chat_pinecone_service import PineconeService

logger = logging.getLogger(__name__)


class RAGService:
    """Service for Retrieval-Augmented Generation."""
    
    def __init__(self):
        """Initialize the RAG service."""
        if not settings.GEMINI_API_KEY:
            raise ValueError("Gemini API key not configured")
        
        # Initialize Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.chat_model = genai.GenerativeModel(model_name=GEMINI_MODEL_NAME)
        
        # Initialize other services
        self.embedding_service = EmbeddingService()
        self.pinecone_service = PineconeService()
    
    async def generate_answer(self, question: str, provinces: List[str]) -> str:
        """
        Generate a RAG answer using retrieved context and Gemini.
        
        Args:
            question: User's question
            provinces: List of provinces to filter context by
            
        Returns:
            Generated answer string
        """
        try:
            # Retrieve relevant context
            context_chunks = await self._retrieve_context(question, provinces)
            
            if not context_chunks:
                return NO_CONTEXT_RESPONSE
            
            # Generate answer using Gemini
            context = '\n\n'.join(context_chunks)
            prompt = LEGAL_PROMPT_TEMPLATE.format(
                question=question.strip(),
                context=context
            )
            
            response = self.chat_model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"Error generating RAG answer: {e}")
            return NO_CONTEXT_RESPONSE
    
    async def _retrieve_context(self, question: str, provinces: List[str]) -> List[str]:
        """
        Retrieve relevant context from Pinecone.
        
        Args:
            question: User's question
            provinces: List of provinces to filter by
            
        Returns:
            List of relevant text chunks
        """
        try:
            # Generate embedding for the question
            vector = await self.embedding_service.embed_query(question)
            
            # Retrieve context from Pinecone
            return await self.pinecone_service.retrieve_context(vector, provinces)
            
        except Exception as e:
            logger.error(f"Error retrieving context: {e}")
            return []
