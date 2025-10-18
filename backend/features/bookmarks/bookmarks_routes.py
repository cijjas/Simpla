from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from typing import List
import uuid

from core.database.base import get_db
from core.utils.jwt_utils import verify_token
from .bookmarks_schemas import (
    BookmarkResponse, 
    BookmarkToggleRequest, 
    BookmarkToggleResponse,
    BookmarksListResponse
)
from .bookmarks_service import BookmarksService

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


# Authentication dependency
def get_current_user_id(request: Request) -> str:
    """Get current user ID from JWT token without database query."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    payload = verify_token(token, "access")
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Missing user ID in token")
    
    return user_id


@router.get("/", response_model=BookmarksListResponse)
async def get_user_bookmarks(
    limit: int = Query(default=12, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get paginated bookmarks for the current user"""
    service = BookmarksService(db)
    user_uuid = uuid.UUID(current_user_id)
    
    bookmarks, total_count = service.get_user_bookmarks(user_uuid, limit, offset)
    
    has_more = (offset + len(bookmarks)) < total_count
    
    return BookmarksListResponse(
        bookmarks=bookmarks,
        total_count=total_count,
        has_more=has_more,
        limit=limit,
        offset=offset
    )


@router.post("/toggle", response_model=BookmarkToggleResponse)
async def toggle_bookmark(
    request: BookmarkToggleRequest,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Toggle bookmark status for a norma"""
    service = BookmarksService(db)
    user_uuid = uuid.UUID(current_user_id)
    return service.toggle_bookmark(user_uuid, request.norma_id)


@router.delete("/{norma_id}")
async def remove_bookmark(
    norma_id: int,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Remove a norma from bookmarks"""
    service = BookmarksService(db)
    user_uuid = uuid.UUID(current_user_id)
    success = service.remove_bookmark(user_uuid, norma_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found"
        )
    
    return {"message": "Bookmark removed successfully"}


@router.get("/check/{norma_id}")
async def check_is_bookmarked(
    norma_id: int,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Check if a norma is bookmarked by the current user"""
    service = BookmarksService(db)
    user_uuid = uuid.UUID(current_user_id)
    is_bookmarked = service.is_bookmarked(user_uuid, norma_id)
    
    return {"is_bookmarked": is_bookmarked}

