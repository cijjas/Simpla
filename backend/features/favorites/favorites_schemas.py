from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import uuid


class FavoriteBase(BaseModel):
    norma_id: int


class FavoriteCreate(FavoriteBase):
    pass


class FavoriteResponse(FavoriteBase):
    id: uuid.UUID
    user_id: uuid.UUID
    added_at: datetime
    updated_at: datetime
    is_deleted: bool
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FavoriteToggleRequest(BaseModel):
    norma_id: int


class FavoriteToggleResponse(BaseModel):
    is_favorite: bool
    message: str
