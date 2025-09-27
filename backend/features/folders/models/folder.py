"""SQLAlchemy models for folders and folder-norma relationships."""

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Boolean, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database.base import Base


class Folder(Base):
    """Model for user folders with hierarchical structure."""
    
    __tablename__ = "folders"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    parent_folder_id = Column(String, ForeignKey("folders.id", ondelete="CASCADE"), index=True)
    level = Column(Integer, nullable=False, default=0)
    color = Column(String(7), default="#3B82F6")  # Hex color for UI
    icon = Column(String(50), default="folder")  # Icon identifier
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Constraints
    __table_args__ = (
        CheckConstraint('level >= 0 AND level <= 2', name='check_folder_level'),
    )
    
    # Relationships
    user = relationship("User")
    parent_folder = relationship("Folder", remote_side=[id])
    subfolders = relationship("Folder", cascade="all, delete-orphan")
    folder_normas = relationship("FolderNorma", back_populates="folder", cascade="all, delete-orphan")


class FolderNorma(Base):
    """Model for many-to-many relationship between folders and normas."""
    
    __tablename__ = "folder_normas"
    
    id = Column(String, primary_key=True, index=True)
    folder_id = Column(String, ForeignKey("folders.id", ondelete="CASCADE"), nullable=False, index=True)
    norma_id = Column(Integer, ForeignKey("normas_structured.id", ondelete="CASCADE"), nullable=False, index=True)
    added_by = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    added_at = Column(DateTime, default=func.now())
    order_index = Column(Integer, default=0)
    notes = Column(Text)  # User notes about this norma in this folder
    
    # Constraints
    __table_args__ = (
        CheckConstraint('folder_id != norma_id', name='check_unique_folder_norma'),
    )
    
    # Relationships
    folder = relationship("Folder", back_populates="folder_normas")
    norma = relationship("NormaStructured")
    user = relationship("User")
