"""Pydantic schemas for digest endpoints."""

from datetime import date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from uuid import UUID


class UserPreferencesRequest(BaseModel):
    """Schema for updating user preferences."""
    filter_options: Dict[str, Any] = Field(default_factory=dict, description="User filtering preferences")


class UserPreferencesResponse(BaseModel):
    """Schema for user preferences response."""
    user_id: UUID
    filter_options: Dict[str, Any]


class NormaSummaryItem(BaseModel):
    """Schema for individual norma summary in digest."""
    infoleg_id: int
    tipo_norma: Optional[str] = None
    numero: Optional[int] = None
    titulo: Optional[str] = None
    summary: str
    publicacion: Optional[date] = None


class WeeklyDigestResponse(BaseModel):
    """Schema for weekly digest response."""
    id: UUID
    week_start: date
    week_end: date
    article_summary: Optional[str] = None
    total_normas: int
    article_json: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None


class TriggerDigestRequest(BaseModel):
    """Schema for manually triggering digest generation."""
    week_start: Optional[date] = Field(None, description="Start date for the digest (Monday)")
    week_end: Optional[date] = Field(None, description="End date for the digest (Friday)")


class TriggerDigestResponse(BaseModel):
    """Schema for digest trigger response."""
    success: bool
    message: str
    digest_id: Optional[UUID] = None
    emails_sent: int = 0

