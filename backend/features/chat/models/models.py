"""Pydantic models for chat API endpoints."""

from pydantic import BaseModel, Field
from typing import List, Optional


class ChatMessage(BaseModel):
    """Chat message model."""
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    """Request model for conversational chat."""
    messages: List[ChatMessage] = Field(..., description="List of chat messages")
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0, description="Response temperature")


class ChatResponse(BaseModel):
    """Response model for conversational chat."""
    message: ChatMessage = Field(..., description="Assistant's response message")
    usage: Optional[dict] = Field(None, description="Token usage statistics")


class RagRequest(BaseModel):
    """Request model for RAG (Retrieval-Augmented Generation) chat."""
    question: str = Field(..., min_length=1, description="User's question")
    provinces: Optional[List[str]] = Field(default=[], description="List of provinces to filter by")


class RagResponse(BaseModel):
    """Response model for RAG chat."""
    answer: str = Field(..., description="Generated answer based on retrieved context")
