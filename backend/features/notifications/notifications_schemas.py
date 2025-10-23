"""Pydantic schemas for notifications API."""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any, List
from datetime import datetime


class NotificationResponse(BaseModel):
    """Schema for a single notification."""
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat() if v else None
        }
    )
    
    id: str
    title: str
    body: str
    type: str
    link: Optional[str] = None
    metadata: Optional[Any] = None
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None


class NotificationsListResponse(BaseModel):
    """Schema for paginated notifications list."""
    notifications: List[NotificationResponse]
    total_count: int
    unread_count: int
    page: int
    page_size: int
    has_more: bool


class MarkReadResponse(BaseModel):
    """Schema for mark as read response."""
    success: bool
    message: Optional[str] = None


class DeleteResponse(BaseModel):
    """Schema for delete response."""
    success: bool
    message: Optional[str] = None
    deleted_count: int = 0


class BulkDeleteRequest(BaseModel):
    """Schema for bulk delete request."""
    notification_ids: List[str] = Field(..., min_length=1)

