from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from typing import List, Optional
import uuid

from .favorites_models import Favorite
from .favorites_schemas import FavoriteResponse, FavoriteToggleResponse


class FavoritesService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_favorites(self, user_id: uuid.UUID) -> List[FavoriteResponse]:
        """Get all active favorites for a user"""
        favorites = self.db.query(Favorite).filter(
            and_(
                Favorite.user_id == user_id,
                Favorite.is_deleted == False
            )
        ).order_by(Favorite.added_at.desc()).all()
        
        return [FavoriteResponse.from_orm(fav) for fav in favorites]

    def toggle_favorite(self, user_id: uuid.UUID, norma_id: int) -> FavoriteToggleResponse:
        """Toggle a norma as favorite/unfavorite"""
        existing_favorite = self.db.query(Favorite).filter(
            and_(
                Favorite.user_id == user_id,
                Favorite.norma_id == norma_id,
                Favorite.is_deleted == False
            )
        ).first()

        if existing_favorite:
            # Remove from favorites (soft delete)
            existing_favorite.is_deleted = True
            existing_favorite.deleted_at = datetime.utcnow()
            self.db.commit()
            
            return FavoriteToggleResponse(
                is_favorite=False,
                message="Norma removed from favorites"
            )
        else:
            # Check if there's a deleted favorite we can restore
            deleted_favorite = self.db.query(Favorite).filter(
                and_(
                    Favorite.user_id == user_id,
                    Favorite.norma_id == norma_id,
                    Favorite.is_deleted == True
                )
            ).first()

            if deleted_favorite:
                # Restore deleted favorite
                deleted_favorite.is_deleted = False
                deleted_favorite.deleted_at = None
                deleted_favorite.updated_at = datetime.utcnow()
            else:
                # Create new favorite
                new_favorite = Favorite(
                    user_id=user_id,
                    norma_id=norma_id
                )
                self.db.add(new_favorite)
            
            self.db.commit()
            
            return FavoriteToggleResponse(
                is_favorite=True,
                message="Norma added to favorites"
            )

    def remove_favorite(self, user_id: uuid.UUID, norma_id: int) -> bool:
        """Remove a norma from favorites (soft delete)"""
        favorite = self.db.query(Favorite).filter(
            and_(
                Favorite.user_id == user_id,
                Favorite.norma_id == norma_id,
                Favorite.is_deleted == False
            )
        ).first()

        if favorite:
            favorite.is_deleted = True
            favorite.deleted_at = datetime.utcnow()
            self.db.commit()
            return True
        
        return False

    def is_favorite(self, user_id: uuid.UUID, norma_id: int) -> bool:
        """Check if a norma is favorited by a user"""
        favorite = self.db.query(Favorite).filter(
            and_(
                Favorite.user_id == user_id,
                Favorite.norma_id == norma_id,
                Favorite.is_deleted == False
            )
        ).first()
        
        return favorite is not None

    def get_favorite_norma_ids(self, user_id: uuid.UUID) -> List[int]:
        """Get list of norma IDs that are favorited by the user"""
        favorites = self.db.query(Favorite.norma_id).filter(
            and_(
                Favorite.user_id == user_id,
                Favorite.is_deleted == False
            )
        ).all()
        
        return [fav.norma_id for fav in favorites]
