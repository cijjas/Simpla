"""Pydantic schemas for message feedback API."""

from datetime import datetime
from typing import Literal
from uuid import UUID
from pydantic import BaseModel


# Feedback types
FeedbackType = Literal["like", "dislike"]


class FeedbackBase(BaseModel):
    """Base feedback schema."""
    feedback_type: FeedbackType


class FeedbackCreate(FeedbackBase):
    """Schema for creating feedback."""
    message_id: UUID


class FeedbackUpdate(FeedbackBase):
    """Schema for updating feedback."""
    pass


class FeedbackResponse(FeedbackBase):
    """Schema for feedback response."""
    id: UUID
    message_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FeedbackDelete(BaseModel):
    """Schema for feedback deletion response."""
    message: str = "Feedback removed successfully"



