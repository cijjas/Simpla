from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
import uuid


class BookmarkBase(BaseModel):
    norma_id: int


class BookmarkCreate(BookmarkBase):
    pass


class BookmarkResponse(BookmarkBase):
    id: uuid.UUID
    user_id: uuid.UUID
    added_at: datetime
    updated_at: datetime
    is_deleted: bool
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BookmarkToggleRequest(BaseModel):
    norma_id: int


class BookmarkToggleResponse(BaseModel):
    is_bookmarked: bool
    message: str


class BookmarksListResponse(BaseModel):
    bookmarks: List[BookmarkResponse]
    total_count: int
    has_more: bool
    limit: int
    offset: int

