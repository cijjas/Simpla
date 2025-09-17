"""Pinecone service for vector database operations."""

import logging
from typing import List, Optional, Dict, Any
from pinecone import Pinecone
from config import settings

logger = logging.getLogger(__name__)


class PineconeService:
    """Service for interacting with Pinecone vector database."""
    
    def __init__(self):
        """Initialize the Pinecone service."""
        if not all([settings.PINECONE_API_KEY, settings.PINECONE_INDEX_NAME]):
            raise ValueError("Pinecone configuration incomplete")
        
        self.pinecone = Pinecone(api_key=settings.PINECONE_API_KEY)
        self.index = self.pinecone.Index(
            settings.PINECONE_INDEX_NAME, 
            host=settings.PINECONE_HOST
        )
    
    async def query_similar(
        self, 
        vector: List[float], 
        top_k: int = 5,
        filter_dict: Optional[Dict[str, Any]] = None
    ) -> List[str]:
        """
        Query similar vectors from Pinecone.
        
        Args:
            vector: Query vector
            top_k: Number of results to return
            filter_dict: Optional filter for metadata
            
        Returns:
            List of text content from matching vectors
        """
        try:
            response = self.index.query(
                vector=vector,
                top_k=top_k,
                include_metadata=True,
                filter=filter_dict
            )
            
            texts = []
            if response.matches:
                for match in response.matches:
                    if match.metadata and 'text' in match.metadata:
                        texts.append(str(match.metadata['text']))
            
            return texts
            
        except Exception as e:
            logger.error(f"Error querying Pinecone: {e}")
            return []
    
    async def retrieve_context(
        self, 
        vector: List[float], 
        provinces: Optional[List[str]] = None
    ) -> List[str]:
        """
        Retrieve relevant context from Pinecone based on provinces filter.
        
        Args:
            vector: Query vector
            provinces: Optional list of provinces to filter by
            
        Returns:
            List of relevant text chunks
        """
        filter_dict = None
        if provinces:
            filter_dict = {"province": {"$in": provinces}}
        
        return await self.query_similar(
            vector=vector,
            top_k=settings.K_RETRIEVE,
            filter_dict=filter_dict
        )
