"""SQLAlchemy models for folders and folder-norma relationships."""

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Boolean, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database.base import Base
import uuid


class Folder(Base):
    """Model for user folders with hierarchical structure."""
    
    __tablename__ = "folders"
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(PostgresUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    parent_folder_id = Column(PostgresUUID(as_uuid=True), ForeignKey("folders.id", ondelete="CASCADE"), index=True)
    level = Column(Integer, nullable=False, default=0)
    color = Column(String(7), nullable=True)  # Hex color for UI, nullable
    icon = Column(String(50), default="folder")  # Icon identifier
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Constraints
    __table_args__ = (
        CheckConstraint('level >= 0 AND level <= 100', name='check_folder_level'),
        CheckConstraint('id != parent_folder_id', name='check_no_self_reference'),
    )
    
    # Relationships
    user = relationship("User")
    parent_folder = relationship("Folder", remote_side=[id], back_populates="subfolders")
    subfolders = relationship("Folder", cascade="all, delete-orphan", back_populates="parent_folder", overlaps="parent_folder")
    folder_normas = relationship("FolderNorma", back_populates="folder", cascade="all, delete-orphan")


class FolderNorma(Base):
    """Model for many-to-many relationship between folders and normas."""
    
    __tablename__ = "folder_normas"
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    folder_id = Column(PostgresUUID(as_uuid=True), ForeignKey("folders.id", ondelete="CASCADE"), nullable=False, index=True)
    norma_id = Column(Integer, nullable=False, index=True)  # Will add FK constraint when normas_structured table exists
    added_by = Column(PostgresUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    added_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    order_index = Column(Integer, default=0)
    notes = Column(Text)  # User notes about this norma in this folder
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    folder = relationship("Folder", back_populates="folder_normas")
    # norma = relationship("NormaStructured")  # Will uncomment when normas_structured table exists
    user = relationship("User")
