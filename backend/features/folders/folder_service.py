"""Service layer for folder business logic."""

from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from fastapi import HTTPException, status

from features.folders.folder_models import Folder, FolderNorma
from features.folders.folder_schemas import (
    FolderCreate, FolderUpdate, FolderMove, FolderResponse,
    FolderTreeResponse, FolderNormaCreate, FolderNormaUpdate,
    FolderNormaWithNorma, FolderWithNormasResponse
)
from core.utils.logging_config import get_logger
from datetime import datetime
import uuid as uuid_lib

logger = get_logger(__name__)


class FolderService:
    """Service for folder operations."""

    @staticmethod
    def build_folder_tree(folders: List[Folder]) -> List[FolderTreeResponse]:
        """Build hierarchical folder tree structure."""
        folder_dict = {
            folder.id: {
                "id": str(folder.id),
                "name": folder.name,
                "description": folder.description,
                "level": folder.level,
                "color": folder.color,
                "icon": folder.icon,
                "order_index": folder.order_index,
                "norma_count": getattr(folder, 'norma_count', 0),
                "subfolders": []
            } for folder in folders
        }
        
        # Build the tree structure
        root_folders = []
        for folder in folders:
            if folder.parent_folder_id is None:
                root_folders.append(folder_dict[folder.id])
            else:
                if folder.parent_folder_id in folder_dict:
                    folder_dict[folder.parent_folder_id]["subfolders"].append(folder_dict[folder.id])
        
        # Sort by order_index
        for folder_data in folder_dict.values():
            folder_data["subfolders"].sort(key=lambda x: x["order_index"])
        
        root_folders.sort(key=lambda x: x["order_index"])
        return [FolderTreeResponse(**folder_data) for folder_data in root_folders]

    @staticmethod
    def get_user_folders_tree(db: Session, user_id: str) -> List[FolderTreeResponse]:
        """Get all folders for user in tree structure."""
        from sqlalchemy import select as sa_select
        
        # Optimized query with norma count
        norma_count_subquery = (
            sa_select(func.count(FolderNorma.id))
            .where(
                and_(
                    FolderNorma.folder_id == Folder.id,
                    ~FolderNorma.is_deleted
                )
            )
            .correlate(Folder)
            .scalar_subquery()
        )
        
        folders_with_counts = db.query(
            Folder,
            norma_count_subquery.label('norma_count')
        ).filter(
            and_(
                Folder.user_id == user_id,
                ~Folder.is_deleted
            )
        ).order_by(Folder.order_index).all()
        
        folders = []
        for folder, norma_count in folders_with_counts:
            folder.norma_count = norma_count
            folders.append(folder)
        
        return FolderService.build_folder_tree(folders)

    @staticmethod
    def get_folder_by_id(db: Session, folder_id: UUID, user_id: str) -> Folder:
        """Get folder by ID, ensuring it belongs to user."""
        folder = db.query(Folder).filter(
            and_(
                Folder.id == folder_id,
                Folder.user_id == user_id,
                ~Folder.is_deleted
            )
        ).first()
        
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found"
            )
        return folder

    @staticmethod
    def validate_parent_folder(db: Session, parent_id: UUID, user_id: str, current_folder_id: Optional[UUID] = None) -> int:
        """Validate parent folder and return new level. Returns 0 for root folders."""
        parent = db.query(Folder).filter(
            and_(
                Folder.id == parent_id,
                Folder.user_id == user_id
            )
        ).first()
        
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent folder not found"
            )
        
        new_level = parent.level + 1
        if new_level > 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum folder depth is 2 levels"
            )
        
        # Check for circular reference
        if current_folder_id and parent_id == current_folder_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot move folder to itself"
            )
        
        return new_level

    @staticmethod
    def check_name_conflict(db: Session, user_id: str, name: str, parent_id: Optional[UUID], exclude_id: Optional[UUID] = None):
        """Check if folder name already exists at the same level."""
        query = db.query(Folder).filter(
            and_(
                Folder.user_id == user_id,
                Folder.name == name,
                Folder.parent_folder_id == parent_id
            )
        )
        
        if exclude_id:
            query = query.filter(Folder.id != exclude_id)
        
        if query.first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Folder with this name already exists at this level"
            )

    @staticmethod
    def get_next_order_index(db: Session, user_id: str, parent_id: Optional[UUID]) -> int:
        """Get next available order index for folder."""
        max_order = db.query(func.max(Folder.order_index)).filter(
            and_(
                Folder.user_id == user_id,
                Folder.parent_folder_id == parent_id
            )
        ).scalar() or 0
        return max_order + 1

    @staticmethod
    def create_folder(db: Session, user_id: str, folder_data: FolderCreate) -> Folder:
        """Create a new folder."""
        level = 0
        parent_id = UUID(folder_data.parent_folder_id) if folder_data.parent_folder_id else None
        
        if parent_id:
            level = FolderService.validate_parent_folder(db, parent_id, user_id)
        
        FolderService.check_name_conflict(db, user_id, folder_data.name, parent_id)
        order_index = FolderService.get_next_order_index(db, user_id, parent_id)
        
        folder = Folder(
            user_id=user_id,
            name=folder_data.name,
            description=folder_data.description,
            parent_folder_id=parent_id,
            level=level,
            color=folder_data.color,
            icon=folder_data.icon,
            order_index=order_index
        )
        
        db.add(folder)
        db.commit()
        db.refresh(folder)
        return folder

    @staticmethod
    def update_folder(db: Session, folder_id: UUID, user_id: str, folder_data: FolderUpdate) -> Folder:
        """Update a folder."""
        folder = FolderService.get_folder_by_id(db, folder_id, user_id)
        
        # Check name conflict
        if folder_data.name and folder_data.name != folder.name:
            FolderService.check_name_conflict(db, user_id, folder_data.name, folder.parent_folder_id, folder_id)
        
        # Handle parent change
        if folder_data.parent_folder_id is not None and folder_data.parent_folder_id != str(folder.parent_folder_id):
            new_parent_id = UUID(folder_data.parent_folder_id) if folder_data.parent_folder_id else None
            if new_parent_id:
                folder.level = FolderService.validate_parent_folder(db, new_parent_id, user_id, folder_id)
                folder.parent_folder_id = new_parent_id
            else:
                folder.level = 0
                folder.parent_folder_id = None
        
        # Update other fields
        update_data = folder_data.model_dump(exclude_unset=True, exclude={'parent_folder_id'})
        for field, value in update_data.items():
            setattr(folder, field, value)
        
        db.commit()
        db.refresh(folder)
        return folder

    @staticmethod
    def delete_folder(db: Session, folder_id: UUID, user_id: str):
        """Delete a folder (cascade deletes subfolders)."""
        folder = FolderService.get_folder_by_id(db, folder_id, user_id)
        db.delete(folder)
        db.commit()

    @staticmethod
    def get_folder_normas(db: Session, folder_id: UUID, user_id: str) -> FolderWithNormasResponse:
        """Get folder with all its normas."""
        folder = FolderService.get_folder_by_id(db, folder_id, user_id)
        
        folder_normas = db.query(FolderNorma).filter(
            and_(
                FolderNorma.folder_id == folder_id,
                ~FolderNorma.is_deleted
            )
        ).order_by(FolderNorma.order_index).all()
        
        # Fetch norma details
        from shared.utils.norma_reconstruction import get_norma_reconstructor
        reconstructor = get_norma_reconstructor()
        
        norma_ids = [fn.norma_id for fn in folder_normas]
        normas_data = []
        
        if norma_ids:
            try:
                normas_data = reconstructor.get_normas_summaries_batch(norma_ids)
            except Exception as e:
                logger.error(f"Error fetching normas batch: {str(e)}")
        
        normas_by_id = {norma['infoleg_id']: norma for norma in normas_data}
        
        # Build response
        normas_with_details = []
        for fn in folder_normas:
            norma_data = normas_by_id.get(fn.norma_id)
            if not norma_data:
                # Fallback for missing normas
                norma_data = {
                    "id": fn.norma_id,
                    "infoleg_id": fn.norma_id,
                    "titulo_resumido": f"Norma {fn.norma_id} (No disponible)",
                    "jurisdiccion": "Nacional",
                    "tipo_norma": "LEY",
                    "sancion": None,
                    "publicacion": None,
                    "estado": "VIGENTE",
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
            
            normas_with_details.append(FolderNormaWithNorma(
                id=str(fn.id),
                norma=norma_data,
                added_at=fn.added_at,
                order_index=fn.order_index,
                notes=fn.notes
            ))
        
        return FolderWithNormasResponse(
            folder=FolderResponse(
                id=str(folder.id),
                name=folder.name,
                description=folder.description,
                parent_folder_id=str(folder.parent_folder_id) if folder.parent_folder_id else None,
                level=folder.level,
                color=folder.color,
                icon=folder.icon,
                order_index=folder.order_index,
                created_at=folder.created_at,
                updated_at=folder.updated_at,
                norma_count=len(normas_with_details)
            ),
            normas=normas_with_details
        )

    @staticmethod
    def add_norma_to_folder(db: Session, folder_id: UUID, user_id: str, norma_data: FolderNormaCreate) -> FolderNorma:
        """Add a norma to folder."""
        # Verify folder exists and belongs to user
        FolderService.get_folder_by_id(db, folder_id, user_id)
        
        # Check if already exists
        existing = db.query(FolderNorma).filter(
            and_(
                FolderNorma.folder_id == folder_id,
                FolderNorma.norma_id == norma_data.norma_id,
                ~FolderNorma.is_deleted
            )
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Norma is already in this folder"
            )
        
        max_order = db.query(func.max(FolderNorma.order_index)).filter(
            FolderNorma.folder_id == folder_id
        ).scalar() or 0
        
        folder_norma = FolderNorma(
            id=str(uuid_lib.uuid4()),
            folder_id=folder_id,
            norma_id=norma_data.norma_id,
            added_by=user_id,
            notes=norma_data.notes,
            order_index=norma_data.order_index if norma_data.order_index is not None else max_order + 1
        )
        
        db.add(folder_norma)
        db.commit()
        db.refresh(folder_norma)
        return folder_norma

    @staticmethod
    def update_folder_norma(db: Session, folder_id: UUID, norma_id: int, user_id: str, update_data: FolderNormaUpdate) -> FolderNorma:
        """Update folder-norma relationship."""
        FolderService.get_folder_by_id(db, folder_id, user_id)
        
        folder_norma = db.query(FolderNorma).filter(
            and_(
                FolderNorma.folder_id == folder_id,
                FolderNorma.norma_id == norma_id,
                ~FolderNorma.is_deleted
            )
        ).first()
        
        if not folder_norma:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Norma not found in this folder"
            )
        
        update_fields = update_data.model_dump(exclude_unset=True)
        for field, value in update_fields.items():
            setattr(folder_norma, field, value)
        
        db.commit()
        db.refresh(folder_norma)
        return folder_norma

    @staticmethod
    def remove_norma_from_folder(db: Session, folder_id: UUID, norma_id: int, user_id: str):
        """Remove norma from folder."""
        FolderService.get_folder_by_id(db, folder_id, user_id)
        
        folder_norma = db.query(FolderNorma).filter(
            and_(
                FolderNorma.folder_id == folder_id,
                FolderNorma.norma_id == norma_id,
                ~FolderNorma.is_deleted
            )
        ).first()
        
        if not folder_norma:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Norma not found in this folder"
            )
        
        db.delete(folder_norma)
        db.commit()

    @staticmethod
    def get_folders_containing_norma(db: Session, norma_id: int, user_id: str) -> List[str]:
        """Get list of folder IDs containing a specific norma."""
        folder_normas = db.query(FolderNorma).join(Folder).filter(
            and_(
                FolderNorma.norma_id == norma_id,
                Folder.user_id == user_id,
                ~FolderNorma.is_deleted
            )
        ).all()
        
        return [str(fn.folder_id) for fn in folder_normas]

    @staticmethod
    def bulk_update_norma_folders(db: Session, norma_id: int, user_id: str, operations: dict) -> dict:
        """Bulk add/remove norma to/from folders."""
        add_to_folders = operations.get("add_to_folders", [])
        remove_from_folders = operations.get("remove_from_folders", [])
        notes = operations.get("notes", "")
        
        results = {"added": [], "removed": [], "errors": []}
        
        # Remove from folders
        for folder_id_str in remove_from_folders:
            try:
                folder_id = UUID(folder_id_str)
                FolderService.remove_norma_from_folder(db, folder_id, norma_id, user_id)
                results["removed"].append(folder_id_str)
            except Exception as e:
                results["errors"].append(f"Error removing from folder {folder_id_str}: {str(e)}")
        
        # Add to folders
        for folder_id_str in add_to_folders:
            try:
                folder_id = UUID(folder_id_str)
                norma_data = FolderNormaCreate(norma_id=norma_id, notes=notes)
                FolderService.add_norma_to_folder(db, folder_id, user_id, norma_data)
                results["added"].append(folder_id_str)
            except HTTPException as e:
                if e.status_code == 400 and "already in" in e.detail:
                    continue  # Skip if already exists
                results["errors"].append(f"Error adding to folder {folder_id_str}: {e.detail}")
            except Exception as e:
                results["errors"].append(f"Error adding to folder {folder_id_str}: {str(e)}")
        
        db.commit()
        return results

