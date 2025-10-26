"""Pydantic schemas for daily digest endpoints."""

from datetime import date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from uuid import UUID


class DigestPreferencesRequest(BaseModel):
    """Schema for updating user digest preferences."""
    dependencia_ids: List[str] = Field(..., description="List of organism IDs the user wants to see in their digest")


class DigestPreferencesResponse(BaseModel):
    """Schema for user digest preferences response."""
    user_id: UUID
    dependencia_ids: List[str]


class OrganismInfo(BaseModel):
    """Schema for organism information."""
    id: str
    nombre_oficial: str
    nivel: int


class AvailableOrganismsResponse(BaseModel):
    """Schema for available organisms response."""
    organisms: List[OrganismInfo]


class NormaSummaryForDigest(BaseModel):
    """Schema for individual norma summary in daily digest."""
    norma_id: int
    summary: str
    root_dependencia_id: Optional[str] = None


class OrganismDigestSummary(BaseModel):
    """Schema for organism-level digest summary."""
    organism_id: str
    organism_name: str
    summary: str
    norma_count: int
    normas: List[NormaSummaryForDigest] = []


class DailyDigestResponse(BaseModel):
    """Schema for daily digest response."""
    date: date
    has_preferences: bool
    organism_summaries: List[OrganismDigestSummary] = []
    total_normas: int = 0


class GenerateDailyDigestRequest(BaseModel):
    """Schema for manually triggering daily digest generation."""
    target_date: Optional[date] = Field(None, description="Date to generate digest for (defaults to today)")


class GenerateDailyDigestResponse(BaseModel):
    """Schema for daily digest generation response."""
    success: bool
    message: str
    date: date
    norma_summaries_generated: int = 0
    organism_summaries_generated: int = 0