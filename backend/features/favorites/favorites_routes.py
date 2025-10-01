from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
import uuid

from core.database.base import get_db
from core.utils.jwt_utils import verify_token
from .favorites_schemas import FavoriteResponse, FavoriteToggleRequest, FavoriteToggleResponse
from .favorites_service import FavoritesService

router = APIRouter(prefix="/favorites", tags=["favorites"])


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


@router.get("/", response_model=List[FavoriteResponse])
async def get_user_favorites(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all favorites for the current user"""
    service = FavoritesService(db)
    # Convert string user_id to UUID
    user_uuid = uuid.UUID(current_user_id)
    return service.get_user_favorites(user_uuid)


@router.post("/toggle", response_model=FavoriteToggleResponse)
async def toggle_favorite(
    request: FavoriteToggleRequest,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Toggle favorite status for a norma"""
    service = FavoritesService(db)
    # Convert string user_id to UUID
    user_uuid = uuid.UUID(current_user_id)
    return service.toggle_favorite(user_uuid, request.norma_id)


@router.delete("/{norma_id}")
async def remove_favorite(
    norma_id: int,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Remove a norma from favorites"""
    service = FavoritesService(db)
    # Convert string user_id to UUID
    user_uuid = uuid.UUID(current_user_id)
    success = service.remove_favorite(user_uuid, norma_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found"
        )
    
    return {"message": "Favorite removed successfully"}


@router.get("/check/{norma_id}")
async def check_is_favorite(
    norma_id: int,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Check if a norma is favorited by the current user"""
    service = FavoritesService(db)
    # Convert string user_id to UUID
    user_uuid = uuid.UUID(current_user_id)
    is_favorite = service.is_favorite(user_uuid, norma_id)
    
    return {"is_favorite": is_favorite}
