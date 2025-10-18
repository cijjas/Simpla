from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime
from typing import List, Optional, Tuple
import uuid

from .bookmarks_models import Bookmark
from .bookmarks_schemas import BookmarkResponse, BookmarkToggleResponse


class BookmarksService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_bookmarks(
        self, 
        user_id: uuid.UUID, 
        limit: int = 12, 
        offset: int = 0
    ) -> Tuple[List[BookmarkResponse], int]:
        """
        Get paginated bookmarks for a user
        Returns: (bookmarks, total_count)
        """
        # Get total count
        total_count = self.db.query(func.count(Bookmark.id)).filter(
            and_(
                Bookmark.user_id == user_id,
                Bookmark.is_deleted == False
            )
        ).scalar()
        
        # Get paginated bookmarks
        bookmarks = self.db.query(Bookmark).filter(
            and_(
                Bookmark.user_id == user_id,
                Bookmark.is_deleted == False
            )
        ).order_by(Bookmark.added_at.desc()).limit(limit).offset(offset).all()
        
        return (
            [BookmarkResponse.from_orm(bookmark) for bookmark in bookmarks],
            total_count or 0
        )

    def toggle_bookmark(self, user_id: uuid.UUID, norma_id: int) -> BookmarkToggleResponse:
        """Toggle a norma as bookmarked/unbookmarked"""
        existing_bookmark = self.db.query(Bookmark).filter(
            and_(
                Bookmark.user_id == user_id,
                Bookmark.norma_id == norma_id,
                Bookmark.is_deleted == False
            )
        ).first()

        if existing_bookmark:
            # Remove from bookmarks (soft delete)
            existing_bookmark.is_deleted = True
            existing_bookmark.deleted_at = datetime.utcnow()
            self.db.commit()
            
            return BookmarkToggleResponse(
                is_bookmarked=False,
                message="Norma removed from bookmarks"
            )
        else:
            # Check if there's a deleted bookmark we can restore
            deleted_bookmark = self.db.query(Bookmark).filter(
                and_(
                    Bookmark.user_id == user_id,
                    Bookmark.norma_id == norma_id,
                    Bookmark.is_deleted == True
                )
            ).first()

            if deleted_bookmark:
                # Restore deleted bookmark
                deleted_bookmark.is_deleted = False
                deleted_bookmark.deleted_at = None
                deleted_bookmark.updated_at = datetime.utcnow()
            else:
                # Create new bookmark
                new_bookmark = Bookmark(
                    user_id=user_id,
                    norma_id=norma_id
                )
                self.db.add(new_bookmark)
            
            self.db.commit()
            
            return BookmarkToggleResponse(
                is_bookmarked=True,
                message="Norma added to bookmarks"
            )

    def remove_bookmark(self, user_id: uuid.UUID, norma_id: int) -> bool:
        """Remove a norma from bookmarks (soft delete)"""
        bookmark = self.db.query(Bookmark).filter(
            and_(
                Bookmark.user_id == user_id,
                Bookmark.norma_id == norma_id,
                Bookmark.is_deleted == False
            )
        ).first()

        if bookmark:
            bookmark.is_deleted = True
            bookmark.deleted_at = datetime.utcnow()
            self.db.commit()
            return True
        
        return False

    def is_bookmarked(self, user_id: uuid.UUID, norma_id: int) -> bool:
        """Check if a norma is bookmarked by a user"""
        bookmark = self.db.query(Bookmark).filter(
            and_(
                Bookmark.user_id == user_id,
                Bookmark.norma_id == norma_id,
                Bookmark.is_deleted == False
            )
        ).first()
        
        return bookmark is not None

    def get_bookmarked_norma_ids(self, user_id: uuid.UUID) -> List[int]:
        """Get list of norma IDs that are bookmarked by the user"""
        bookmarks = self.db.query(Bookmark.norma_id).filter(
            and_(
                Bookmark.user_id == user_id,
                Bookmark.is_deleted == False
            )
        ).all()
        
        return [bookmark.norma_id for bookmark in bookmarks]

