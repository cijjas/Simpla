"""Router for folder-related endpoints - Simplified with service layer."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from uuid import UUID

from core.database.base import get_db
from features.folders.folder_schemas import (
    FolderCreate, FolderUpdate, FolderMove, FolderResponse, FolderTreeResponse,
    FolderNormaCreate, FolderNormaUpdate, FolderNormaWithNorma,
    FolderWithNormasResponse, FolderCreateResponse, FolderNormaResponse
)
from features.folders.folder_service import FolderService
from features.auth.auth_utils import verify_token
from core.utils.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter()


def get_current_user_id(request: Request) -> str:
    """Get current user ID from JWT token."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    payload = verify_token(token, "access")
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    return user_id


@router.get("/folders/", response_model=List[FolderTreeResponse])
async def get_user_folders(
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Get all folders for the current user in hierarchical tree structure."""
    logger.info(f"Fetching folders for user {user_id}")
    return FolderService.get_user_folders_tree(db, user_id)


@router.post("/folders/", response_model=FolderCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_folder(
    folder_data: FolderCreate,
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Create a new folder."""
    logger.info(f"Creating folder '{folder_data.name}' for user {user_id}")
    folder = FolderService.create_folder(db, user_id, folder_data)
    
    return FolderCreateResponse(
        id=str(folder.id),
        name=folder.name,
        description=folder.description,
        parent_folder_id=str(folder.parent_folder_id) if folder.parent_folder_id else None,
        level=folder.level,
        color=folder.color,
        icon=folder.icon,
        order_index=folder.order_index,
        created_at=folder.created_at
    )


@router.get("/folders/{folder_id}/", response_model=FolderResponse)
async def get_folder(
    folder_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific folder by ID."""
    logger.info(f"Fetching folder {folder_id} for user {user_id}")
    
    try:
        folder = FolderService.get_folder_by_id(db, UUID(folder_id), user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid folder ID format")
    
    # Count normas
    from features.folders.folder_models import FolderNorma
    from sqlalchemy import and_
    norma_count = db.query(FolderNorma).filter(
        and_(
            FolderNorma.folder_id == folder.id,
            ~FolderNorma.is_deleted
        )
    ).count()
    
    return FolderResponse(
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
        norma_count=norma_count
    )


@router.put("/folders/{folder_id}/", response_model=FolderResponse)
async def update_folder(
    folder_id: str,
    folder_data: FolderUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Update a folder."""
    logger.info(f"Updating folder {folder_id} for user {user_id}")
    
    try:
        folder = FolderService.update_folder(db, UUID(folder_id), user_id, folder_data)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid folder ID format")
    
    # Count normas
    from features.folders.folder_models import FolderNorma
    from sqlalchemy import and_
    norma_count = db.query(FolderNorma).filter(
        and_(
            FolderNorma.folder_id == folder.id,
            ~FolderNorma.is_deleted
        )
    ).count()
    
    return FolderResponse(
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
        norma_count=norma_count
    )


@router.patch("/folders/{folder_id}/move/", response_model=FolderResponse)
async def move_folder(
    folder_id: str,
    move_data: FolderMove,
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Move a folder to a different parent or change its order."""
    logger.info(f"Moving folder {folder_id} for user {user_id}")
    
    try:
        folder_uuid = UUID(folder_id)
        folder = FolderService.get_folder_by_id(db, folder_uuid, user_id)
        
        # Handle parent change
        if move_data.parent_folder_id is not None:
            new_parent_id = UUID(move_data.parent_folder_id) if move_data.parent_folder_id else None
            if new_parent_id:
                folder.level = FolderService.validate_parent_folder(db, new_parent_id, user_id, folder_uuid)
                folder.parent_folder_id = new_parent_id
            else:
                folder.level = 0
                folder.parent_folder_id = None
        
        # Handle order change
        if move_data.order_index is not None:
            folder.order_index = move_data.order_index
        
        db.commit()
        db.refresh(folder)
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid folder ID format")
    
    # Count normas
    from features.folders.folder_models import FolderNorma
    from sqlalchemy import and_
    norma_count = db.query(FolderNorma).filter(
        and_(
            FolderNorma.folder_id == folder.id,
            ~FolderNorma.is_deleted
        )
    ).count()
    
    return FolderResponse(
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
        norma_count=norma_count
    )


@router.delete("/folders/{folder_id}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(
    folder_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Delete a folder and all its subfolders."""
    logger.info(f"Deleting folder {folder_id} for user {user_id}")
    
    try:
        FolderService.delete_folder(db, UUID(folder_id), user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid folder ID format")


@router.get("/folders/{folder_id}/normas/", response_model=FolderWithNormasResponse)
async def get_folder_normas(
    folder_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Get all normas in a specific folder with full norma details."""
    logger.info(f"Fetching normas in folder {folder_id} for user {user_id}")
    
    try:
        return FolderService.get_folder_normas(db, UUID(folder_id), user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid folder ID format")


@router.post("/folders/{folder_id}/normas/", response_model=FolderNormaWithNorma, status_code=status.HTTP_201_CREATED)
async def add_norma_to_folder(
    folder_id: str,
    norma_data: FolderNormaCreate,
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Add a norma to a folder."""
    logger.info(f"Adding norma {norma_data.norma_id} to folder {folder_id} for user {user_id}")
    
    try:
        folder_norma = FolderService.add_norma_to_folder(db, UUID(folder_id), user_id, norma_data)
        
        # Return simplified response
        return FolderNormaWithNorma(
            id=str(folder_norma.id),
            norma={
                "id": norma_data.norma_id,
                "infoleg_id": norma_data.norma_id,
                "titulo_resumido": f"Norma {norma_data.norma_id}",
                "jurisdiccion": "Nacional",
                "tipo_norma": "LEY",
                "sancion": None,
                "publicacion": None,
                "estado": "VIGENTE"
            },
            added_at=folder_norma.added_at,
            order_index=folder_norma.order_index,
            notes=folder_norma.notes
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid folder ID format")


@router.put("/folders/{folder_id}/normas/{norma_id}/", response_model=FolderNormaResponse)
async def update_folder_norma(
    folder_id: str,
    norma_id: int,
    update_data: FolderNormaUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Update folder-norma relationship (notes, order)."""
    logger.info(f"Updating norma {norma_id} in folder {folder_id} for user {user_id}")
    
    try:
        folder_norma = FolderService.update_folder_norma(db, UUID(folder_id), norma_id, user_id, update_data)
        
        return FolderNormaResponse(
            id=str(folder_norma.id),
            norma_id=folder_norma.norma_id,
            added_at=folder_norma.added_at,
            order_index=folder_norma.order_index,
            notes=folder_norma.notes
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid folder ID format")


@router.delete("/folders/{folder_id}/normas/{norma_id}/", status_code=status.HTTP_204_NO_CONTENT)
async def remove_norma_from_folder(
    folder_id: str,
    norma_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Remove a norma from a folder."""
    logger.info(f"Removing norma {norma_id} from folder {folder_id} for user {user_id}")
    
    try:
        FolderService.remove_norma_from_folder(db, UUID(folder_id), norma_id, user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid folder ID format")


@router.get("/folders/normas/{norma_id}/", response_model=List[str])
async def get_norma_folders(
    norma_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Get list of folder IDs that contain a specific norma for the current user."""
    logger.info(f"Checking which folders contain norma {norma_id} for user {user_id}")
    return FolderService.get_folders_containing_norma(db, norma_id, user_id)


@router.post("/folders/normas/{norma_id}/bulk/", status_code=status.HTTP_200_OK)
async def bulk_update_norma_folders(
    norma_id: int,
    folder_operations: dict,
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """
    Bulk add/remove a norma to/from multiple folders.
    
    Request body:
    {
        "add_to_folders": ["folder_id_1", "folder_id_2"],
        "remove_from_folders": ["folder_id_3"],
        "notes": "Optional notes for new additions"
    }
    """
    logger.info(f"Bulk updating norma {norma_id} folders for user {user_id}")
    return FolderService.bulk_update_norma_folders(db, norma_id, user_id, folder_operations)
