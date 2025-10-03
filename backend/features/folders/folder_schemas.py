"""Pydantic schemas for folder operations."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from uuid import UUID


class FolderBase(BaseModel):
    """Base folder schema."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    color: Optional[str] = Field(default="#3B82F6", pattern=r"^#[0-9A-Fa-f]{6}$")
    icon: str = Field(default="folder", max_length=50)


class FolderCreate(FolderBase):
    """Schema for creating a new folder."""
    parent_folder_id: Optional[str] = None


class FolderUpdate(BaseModel):
    """Schema for updating a folder."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$|^$")
    icon: Optional[str] = Field(None, max_length=50)
    parent_folder_id: Optional[str] = None


class FolderMove(BaseModel):
    """Schema for moving a folder to a different parent."""
    parent_folder_id: Optional[str] = None
    order_index: Optional[int] = None


class FolderNormaBase(BaseModel):
    """Base folder-norma relationship schema."""
    notes: Optional[str] = None
    order_index: int = 0


class FolderNormaCreate(FolderNormaBase):
    """Schema for adding a norma to a folder."""
    norma_id: int


class FolderNormaUpdate(BaseModel):
    """Schema for updating folder-norma relationship."""
    notes: Optional[str] = None
    order_index: Optional[int] = None


class FolderNormaResponse(BaseModel):
    """Schema for folder-norma relationship response."""
    id: str
    norma_id: int
    added_at: datetime
    order_index: int
    notes: Optional[str] = None


class NormaInFolder(BaseModel):
    """Schema for norma when returned in folder context."""
    id: int
    infoleg_id: int
    titulo_resumido: str
    jurisdiccion: Optional[str] = None
    tipo_norma: Optional[str] = None
    sancion: Optional[str] = None
    publicacion: Optional[str] = None
    estado: Optional[str] = None


class FolderNormaWithNorma(BaseModel):
    """Schema for folder-norma with full norma details."""
    id: str
    norma: NormaInFolder
    added_at: datetime
    order_index: int
    notes: Optional[str] = None


class FolderResponse(BaseModel):
    """Schema for folder response."""
    id: str
    name: str
    description: Optional[str] = None
    parent_folder_id: Optional[str] = None
    level: int
    color: Optional[str]
    icon: str
    order_index: int
    created_at: datetime
    updated_at: datetime
    norma_count: int = 0


class FolderTreeResponse(BaseModel):
    """Schema for hierarchical folder tree response."""
    id: str
    name: str
    description: Optional[str] = None
    level: int
    color: Optional[str]
    icon: str
    order_index: int
    norma_count: int
    subfolders: List["FolderTreeResponse"] = []


class FolderWithNormasResponse(BaseModel):
    """Schema for folder with its normas."""
    folder: FolderResponse
    normas: List[FolderNormaWithNorma]


class FolderCreateResponse(BaseModel):
    """Schema for folder creation response."""
    id: str
    name: str
    description: Optional[str] = None
    parent_folder_id: Optional[str] = None
    level: int
    color: Optional[str]
    icon: str
    order_index: int
    created_at: datetime


# Update forward references
FolderTreeResponse.model_rebuild()
