"""Router for folder-related endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from core.database.base import get_db
from features.folders.models.folder import Folder, FolderNorma
from features.folders.schemas.folder import (
    FolderCreate, FolderUpdate, FolderResponse, FolderTreeResponse,
    FolderNormaCreate, FolderNormaUpdate, FolderNormaWithNorma,
    FolderWithNormasResponse, FolderCreateResponse
)
from features.infoleg.models.norma import NormaStructured
from features.auth.models.user import User
# from features.auth.utils.auth import get_current_user
from core.utils.logging_config import get_logger
import uuid

logger = get_logger(__name__)
router = APIRouter()


def build_folder_tree(folders: List[Folder]) -> List[FolderTreeResponse]:
    """Build hierarchical folder tree structure."""
    folder_dict = {folder.id: {
        "id": folder.id,
        "name": folder.name,
        "description": folder.description,
        "level": folder.level,
        "color": folder.color,
        "icon": folder.icon,
        "order_index": folder.order_index,
        "norma_count": len(folder.folder_normas),
        "subfolders": []
    } for folder in folders}
    
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


@router.get("/folders/", response_model=List[FolderTreeResponse])
async def get_user_folders(
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)  # Temporarily disabled for testing
):
    """Get all folders for the current user in hierarchical tree structure."""
    logger.info("Fetching folders (authentication temporarily disabled)")
    
    # For testing, return empty list since no users are authenticated yet
    # In production, this would be:
    # folders = db.query(Folder).filter(Folder.user_id == current_user.id)...
    
    return []


# Temporarily disabled for testing
# @router.post("/folders/", response_model=FolderCreateResponse, status_code=status.HTTP_201_CREATED)
# async def create_folder(
#     folder_data: FolderCreate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     """Create a new folder."""
#     logger.info(f"Creating folder '{folder_data.name}' for user {current_user.id}")
#     
#     # Check if parent folder exists and belongs to user
#     level = 0
#     if folder_data.parent_folder_id:
#         parent_folder = db.query(Folder).filter(
#             and_(
#                 Folder.id == folder_data.parent_folder_id,
#                 Folder.user_id == current_user.id
#             )
#         ).first()
#         
#         if not parent_folder:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Parent folder not found"
#             )
#         
#         level = parent_folder.level + 1
#         if level > 2:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="Maximum folder depth is 2 levels"
#             )
#     
#     # Check if folder name already exists at the same level
#     existing_folder = db.query(Folder).filter(
#         and_(
#             Folder.user_id == current_user.id,
#             Folder.name == folder_data.name,
#             Folder.parent_folder_id == folder_data.parent_folder_id
#         )
#     ).first()
#     
#     if existing_folder:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Folder with this name already exists at this level"
#         )
#     
#     # Create new folder
#     folder = Folder(
#         id=str(uuid.uuid4()),
#         user_id=current_user.id,
#         name=folder_data.name,
#         description=folder_data.description,
#         parent_folder_id=folder_data.parent_folder_id,
#         level=level,
#         color=folder_data.color,
#         icon=folder_data.icon
#     )
#     
#     db.add(folder)
#     db.commit()
#     db.refresh(folder)
#     
#     logger.info(f"Created folder {folder.id} for user {current_user.id}")
#     return FolderCreateResponse(
#         id=folder.id,
#         name=folder.name,
#         description=folder.description,
#         parent_folder_id=folder.parent_folder_id,
#         level=folder.level,
#         color=folder.color,
#         icon=folder.icon,
#         order_index=folder.order_index,
#         created_at=folder.created_at
#     )


@router.get("/folders/{folder_id}/", response_model=FolderResponse)
async def get_folder(
    folder_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific folder by ID."""
    logger.info(f"Fetching folder {folder_id} for user {current_user.id}")
    
    folder = db.query(Folder).filter(
        and_(
            Folder.id == folder_id,
            Folder.user_id == current_user.id
        )
    ).options(
        joinedload(Folder.folder_normas)
    ).first()
    
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    
    return FolderResponse(
        id=folder.id,
        name=folder.name,
        description=folder.description,
        parent_folder_id=folder.parent_folder_id,
        level=folder.level,
        color=folder.color,
        icon=folder.icon,
        order_index=folder.order_index,
        created_at=folder.created_at,
        updated_at=folder.updated_at,
        norma_count=len(folder.folder_normas)
    )


@router.put("/folders/{folder_id}/", response_model=FolderResponse)
async def update_folder(
    folder_id: str,
    folder_data: FolderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a folder."""
    logger.info(f"Updating folder {folder_id} for user {current_user.id}")
    
    folder = db.query(Folder).filter(
        and_(
            Folder.id == folder_id,
            Folder.user_id == current_user.id
        )
    ).first()
    
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    
    # Check if new name conflicts with existing folder at same level
    if folder_data.name and folder_data.name != folder.name:
        existing_folder = db.query(Folder).filter(
            and_(
                Folder.user_id == current_user.id,
                Folder.name == folder_data.name,
                Folder.parent_folder_id == folder.parent_folder_id,
                Folder.id != folder_id
            )
        ).first()
        
        if existing_folder:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Folder with this name already exists at this level"
            )
    
    # Update folder fields
    update_data = folder_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(folder, field, value)
    
    db.commit()
    db.refresh(folder)
    
    logger.info(f"Updated folder {folder_id} for user {current_user.id}")
    return FolderResponse(
        id=folder.id,
        name=folder.name,
        description=folder.description,
        parent_folder_id=folder.parent_folder_id,
        level=folder.level,
        color=folder.color,
        icon=folder.icon,
        order_index=folder.order_index,
        created_at=folder.created_at,
        updated_at=folder.updated_at,
        norma_count=len(folder.folder_normas)
    )


@router.delete("/folders/{folder_id}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(
    folder_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a folder and all its subfolders."""
    logger.info(f"Deleting folder {folder_id} for user {current_user.id}")
    
    folder = db.query(Folder).filter(
        and_(
            Folder.id == folder_id,
            Folder.user_id == current_user.id
        )
    ).first()
    
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    
    db.delete(folder)  # Cascade will handle subfolders and folder_normas
    db.commit()
    
    logger.info(f"Deleted folder {folder_id} and its subfolders for user {current_user.id}")


@router.get("/folders/{folder_id}/normas/", response_model=FolderWithNormasResponse)
async def get_folder_normas(
    folder_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all normas in a specific folder."""
    logger.info(f"Fetching normas in folder {folder_id} for user {current_user.id}")
    
    folder = db.query(Folder).filter(
        and_(
            Folder.id == folder_id,
            Folder.user_id == current_user.id
        )
    ).first()
    
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    
    # Get folder-norma relationships with norma details
    folder_normas = db.query(FolderNorma).filter(
        FolderNorma.folder_id == folder_id
    ).options(
        joinedload(FolderNorma.norma)
    ).order_by(FolderNorma.order_index).all()
    
    normas_with_details = []
    for fn in folder_normas:
        if fn.norma:  # Ensure norma exists
            normas_with_details.append(FolderNormaWithNorma(
                id=fn.id,
                norma={
                    "id": fn.norma.id,
                    "infoleg_id": fn.norma.infoleg_id,
                    "titulo_resumido": fn.norma.titulo_resumido,
                    "jurisdiccion": fn.norma.jurisdiccion,
                    "tipo_norma": fn.norma.tipo_norma,
                    "sancion": fn.norma.sancion.isoformat() if fn.norma.sancion else None,
                    "publicacion": fn.norma.publicacion.isoformat() if fn.norma.publicacion else None,
                    "estado": fn.norma.estado
                },
                added_at=fn.added_at,
                order_index=fn.order_index,
                notes=fn.notes
            ))
    
    return FolderWithNormasResponse(
        folder=FolderResponse(
            id=folder.id,
            name=folder.name,
            description=folder.description,
            parent_folder_id=folder.parent_folder_id,
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


@router.post("/folders/{folder_id}/normas/", response_model=FolderNormaWithNorma, status_code=status.HTTP_201_CREATED)
async def add_norma_to_folder(
    folder_id: str,
    norma_data: FolderNormaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a norma to a folder."""
    logger.info(f"Adding norma {norma_data.norma_id} to folder {folder_id} for user {current_user.id}")
    
    # Check if folder exists and belongs to user
    folder = db.query(Folder).filter(
        and_(
            Folder.id == folder_id,
            Folder.user_id == current_user.id
        )
    ).first()
    
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    
    # Check if norma exists
    norma = db.query(NormaStructured).filter(
        NormaStructured.id == norma_data.norma_id
    ).first()
    
    if not norma:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Norma not found"
        )
    
    # Check if norma is already in folder
    existing = db.query(FolderNorma).filter(
        and_(
            FolderNorma.folder_id == folder_id,
            FolderNorma.norma_id == norma_data.norma_id
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Norma is already in this folder"
        )
    
    # Create folder-norma relationship
    folder_norma = FolderNorma(
        id=str(uuid.uuid4()),
        folder_id=folder_id,
        norma_id=norma_data.norma_id,
        added_by=current_user.id,
        notes=norma_data.notes,
        order_index=norma_data.order_index
    )
    
    db.add(folder_norma)
    db.commit()
    db.refresh(folder_norma)
    
    logger.info(f"Added norma {norma_data.norma_id} to folder {folder_id}")
    return FolderNormaWithNorma(
        id=folder_norma.id,
        norma={
            "id": norma.id,
            "infoleg_id": norma.infoleg_id,
            "titulo_resumido": norma.titulo_resumido,
            "jurisdiccion": norma.jurisdiccion,
            "tipo_norma": norma.tipo_norma,
            "sancion": norma.sancion.isoformat() if norma.sancion else None,
            "publicacion": norma.publicacion.isoformat() if norma.publicacion else None,
            "estado": norma.estado
        },
        added_at=folder_norma.added_at,
        order_index=folder_norma.order_index,
        notes=folder_norma.notes
    )


@router.delete("/folders/{folder_id}/normas/{norma_id}/", status_code=status.HTTP_204_NO_CONTENT)
async def remove_norma_from_folder(
    folder_id: str,
    norma_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a norma from a folder."""
    logger.info(f"Removing norma {norma_id} from folder {folder_id} for user {current_user.id}")
    
    # Check if folder exists and belongs to user
    folder = db.query(Folder).filter(
        and_(
            Folder.id == folder_id,
            Folder.user_id == current_user.id
        )
    ).first()
    
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    
    # Find and delete folder-norma relationship
    folder_norma = db.query(FolderNorma).filter(
        and_(
            FolderNorma.folder_id == folder_id,
            FolderNorma.norma_id == norma_id
        )
    ).first()
    
    if not folder_norma:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Norma not found in this folder"
        )
    
    db.delete(folder_norma)
    db.commit()
    
    logger.info(f"Removed norma {norma_id} from folder {folder_id}")
