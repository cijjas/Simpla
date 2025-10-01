"""Router for folder-related endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from core.database.base import get_db
from features.folders.folder_models import Folder, FolderNorma
from features.folders.folder_schemas import (
    FolderCreate, FolderUpdate, FolderMove, FolderResponse, FolderTreeResponse,
    FolderNormaCreate, FolderNormaUpdate, FolderNormaWithNorma,
    FolderWithNormasResponse, FolderCreateResponse
)
from features.auth.auth_utils import verify_token
from core.utils.logging_config import get_logger
import uuid

logger = get_logger(__name__)
router = APIRouter()


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
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    return user_id


def build_folder_tree(folders: List[Folder]) -> List[FolderTreeResponse]:
    """Build hierarchical folder tree structure."""
    folder_dict = {folder.id: {
        "id": str(folder.id),
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
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Get all folders for the current user in hierarchical tree structure."""
    logger.info(f"Fetching folders for user {user_id}")
    
    folders = db.query(Folder).filter(
        Folder.user_id == user_id
    ).options(
        joinedload(Folder.folder_normas)
    ).order_by(Folder.order_index).all()
    
    return build_folder_tree(folders)


@router.post("/folders/", response_model=FolderCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_folder(
    folder_data: FolderCreate,
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Create a new folder."""
    logger.info(f"Creating folder '{folder_data.name}' for user {user_id}")
    
    # Check if parent folder exists and belongs to user
    level = 0
    if folder_data.parent_folder_id:
        parent_folder = db.query(Folder).filter(
            and_(
                Folder.id == folder_data.parent_folder_id,
                Folder.user_id == user_id
            )
        ).first()
        
        if not parent_folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent folder not found"
            )
        
        level = parent_folder.level + 1
        if level > 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum folder depth is 2 levels"
            )
    
    # Check if folder name already exists at the same level
    existing_folder = db.query(Folder).filter(
        and_(
            Folder.user_id == user_id,
            Folder.name == folder_data.name,
            Folder.parent_folder_id == folder_data.parent_folder_id
        )
    ).first()
    
    if existing_folder:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Folder with this name already exists at this level"
        )
    
    # Get next order index for this level
    max_order = db.query(func.max(Folder.order_index)).filter(
        and_(
            Folder.user_id == user_id,
            Folder.parent_folder_id == folder_data.parent_folder_id
        )
    ).scalar() or 0
    
    # Create new folder
    folder = Folder(
        user_id=user_id,
        name=folder_data.name,
        description=folder_data.description,
        parent_folder_id=folder_data.parent_folder_id,
        level=level,
        color=folder_data.color,
        icon=folder_data.icon,
        order_index=max_order + 1
    )
    
    db.add(folder)
    db.commit()
    db.refresh(folder)
    
    logger.info(f"Created folder {folder.id} for user {user_id}")
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
    
    folder = db.query(Folder).filter(
        and_(
            Folder.id == folder_id,
            Folder.user_id == user_id
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
        norma_count=len(folder.folder_normas)
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
    
    folder = db.query(Folder).filter(
        and_(
            Folder.id == folder_id,
            Folder.user_id == user_id
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
                Folder.user_id == user_id,
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
    
    # Handle parent folder change
    if folder_data.parent_folder_id is not None and folder_data.parent_folder_id != folder.parent_folder_id:
        # Validate new parent
        if folder_data.parent_folder_id:
            parent_folder = db.query(Folder).filter(
                and_(
                    Folder.id == folder_data.parent_folder_id,
                    Folder.user_id == user_id
                )
            ).first()
            
            if not parent_folder:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent folder not found"
                )
            
            new_level = parent_folder.level + 1
            if new_level > 2:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Maximum folder depth is 2 levels"
                )
            
            # Check for circular reference
            if folder_data.parent_folder_id == folder_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot move folder to itself"
                )
            
            # Check if moving to a descendant
            def is_descendant(parent_id: str, target_id: str) -> bool:
                descendants = db.query(Folder).filter(Folder.parent_folder_id == parent_id).all()
                for desc in descendants:
                    if desc.id == target_id or is_descendant(desc.id, target_id):
                        return True
                return False
            
            if is_descendant(folder_id, folder_data.parent_folder_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot move folder to its own descendant"
                )
            
            folder.level = new_level
        else:
            folder.level = 0
    
    # Update folder fields
    update_data = folder_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(folder, field, value)
    
    db.commit()
    db.refresh(folder)
    
    logger.info(f"Updated folder {folder_id} for user {user_id}")
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
        norma_count=len(folder.folder_normas)
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
    
    folder = db.query(Folder).filter(
        and_(
            Folder.id == folder_id,
            Folder.user_id == user_id
        )
    ).first()
    
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    
    # Handle parent change
    if move_data.parent_folder_id is not None and move_data.parent_folder_id != folder.parent_folder_id:
        if move_data.parent_folder_id:
            parent_folder = db.query(Folder).filter(
                and_(
                    Folder.id == move_data.parent_folder_id,
                    Folder.user_id == user_id
                )
            ).first()
            
            if not parent_folder:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent folder not found"
                )
            
            new_level = parent_folder.level + 1
            if new_level > 2:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Maximum folder depth is 2 levels"
                )
            
            folder.level = new_level
        else:
            folder.level = 0
        
        folder.parent_folder_id = move_data.parent_folder_id
    
    # Handle order change
    if move_data.order_index is not None:
        folder.order_index = move_data.order_index
    
    db.commit()
    db.refresh(folder)
    
    logger.info(f"Moved folder {folder_id} for user {user_id}")
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
        norma_count=len(folder.folder_normas)
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
    
    folder = db.query(Folder).filter(
        and_(
            Folder.id == folder_id,
            Folder.user_id == user_id
        )
    ).first()
    
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    
    db.delete(folder)  # Cascade will handle subfolders and folder_normas
    db.commit()
    
    logger.info(f"Deleted folder {folder_id} and its subfolders for user {user_id}")


@router.get("/folders/{folder_id}/normas/", response_model=FolderWithNormasResponse)
async def get_folder_normas(
    folder_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Get all normas in a specific folder."""
    logger.info(f"Fetching normas in folder {folder_id} for user {user_id}")
    
    folder = db.query(Folder).filter(
        and_(
            Folder.id == folder_id,
            Folder.user_id == user_id
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
                id=str(fn.id),
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
    
    # Check if folder exists and belongs to user
    folder = db.query(Folder).filter(
        and_(
            Folder.id == folder_id,
            Folder.user_id == user_id
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
    
    # Get next order index
    max_order = db.query(func.max(FolderNorma.order_index)).filter(
        FolderNorma.folder_id == folder_id
    ).scalar() or 0
    
    # Create folder-norma relationship
    folder_norma = FolderNorma(
        id=str(uuid.uuid4()),
        folder_id=folder_id,
        norma_id=norma_data.norma_id,
        added_by=user_id,
        notes=norma_data.notes,
        order_index=norma_data.order_index if norma_data.order_index is not None else max_order + 1
    )
    
    db.add(folder_norma)
    db.commit()
    db.refresh(folder_norma)
    
    logger.info(f"Added norma {norma_data.norma_id} to folder {folder_id}")
    return FolderNormaWithNorma(
        id=str(folder_norma.id),
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


@router.put("/folders/{folder_id}/normas/{norma_id}/", response_model=FolderNormaWithNorma)
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
    
    # Check if folder exists and belongs to user
    folder = db.query(Folder).filter(
        and_(
            Folder.id == folder_id,
            Folder.user_id == user_id
        )
    ).first()
    
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Folder not found"
        )
    
    # Find folder-norma relationship
    folder_norma = db.query(FolderNorma).filter(
        and_(
            FolderNorma.folder_id == folder_id,
            FolderNorma.norma_id == norma_id
        )
    ).options(joinedload(FolderNorma.norma)).first()
    
    if not folder_norma:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Norma not found in this folder"
        )
    
    # Update fields
    update_fields = update_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(folder_norma, field, value)
    
    db.commit()
    db.refresh(folder_norma)
    
    logger.info(f"Updated norma {norma_id} in folder {folder_id}")
    return FolderNormaWithNorma(
        id=str(folder_norma.id),
        norma={
            "id": folder_norma.norma.id,
            "infoleg_id": folder_norma.norma.infoleg_id,
            "titulo_resumido": folder_norma.norma.titulo_resumido,
            "jurisdiccion": folder_norma.norma.jurisdiccion,
            "tipo_norma": folder_norma.norma.tipo_norma,
            "sancion": folder_norma.norma.sancion.isoformat() if folder_norma.norma.sancion else None,
            "publicacion": folder_norma.norma.publicacion.isoformat() if folder_norma.norma.publicacion else None,
            "estado": folder_norma.norma.estado
        },
        added_at=folder_norma.added_at,
        order_index=folder_norma.order_index,
        notes=folder_norma.notes
    )


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
    
    # Check if folder exists and belongs to user
    folder = db.query(Folder).filter(
        and_(
            Folder.id == folder_id,
            Folder.user_id == user_id
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