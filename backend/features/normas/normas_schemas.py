"""Pydantic schemas for normas API endpoints."""

from datetime import datetime, date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class NormaReferenciaResponse(BaseModel):
    """Schema for norma reference information."""
    id: int
    norma_id: int
    numero: int
    dependencia: Optional[str] = None
    rama_digesto: Optional[str] = None
    created_at: datetime


class NormaSummaryResponse(BaseModel):
    """Schema for norma summary (without full structure)."""
    id: int
    infoleg_id: int
    jurisdiccion: Optional[str] = None
    clase_norma: Optional[str] = None
    tipo_norma: Optional[str] = None
    sancion: Optional[date] = None
    publicacion: Optional[date] = None
    titulo_sumario: Optional[str] = None
    titulo_resumido: Optional[str] = None
    texto_resumido: Optional[str] = None
    observaciones: Optional[str] = None
    nro_boletin: Optional[str] = None
    pag_boletin: Optional[str] = None
    estado: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    referencia: Optional[NormaReferenciaResponse] = None


class NormaFilterRequest(BaseModel):
    """Schema for norma filtering request."""
    search_term: Optional[str] = Field(None, description="Search term to filter normas")
    jurisdiccion: Optional[str] = Field(None, description="Filter by jurisdiction")
    tipo_norma: Optional[str] = Field(None, description="Filter by norma type")
    clase_norma: Optional[str] = Field(None, description="Filter by norma class")
    estado: Optional[str] = Field(None, description="Filter by status")
    sancion_desde: Optional[date] = Field(None, description="Filter normas sanctioned from this date")
    sancion_hasta: Optional[date] = Field(None, description="Filter normas sanctioned until this date")
    publicacion_desde: Optional[date] = Field(None, description="Filter normas published from this date")
    publicacion_hasta: Optional[date] = Field(None, description="Filter normas published until this date")
    limit: int = Field(50, ge=1, le=100, description="Maximum number of results to return")
    offset: int = Field(0, ge=0, description="Number of results to skip")


class NormaSearchResponse(BaseModel):
    """Schema for norma search response."""
    normas: List[NormaSummaryResponse]
    total_count: int = 0
    has_more: bool = False
    limit: int
    offset: int


class NormaBatchRequest(BaseModel):
    """Schema for batch norma request."""
    infoleg_ids: List[int] = Field(..., description="List of infoleg IDs to fetch")


class NormaBatchResponse(BaseModel):
    """Schema for batch norma response."""
    normas: List[NormaSummaryResponse]
    not_found_ids: List[int] = Field(default_factory=list, description="IDs that were not found")


class NormaFilterOptionsResponse(BaseModel):
    """Schema for norma filter options response."""
    jurisdicciones: List[str]
    tipos_norma: List[str]
    clases_norma: List[str]
    estados: List[str]


class NormaDetailResponse(BaseModel):
    """Schema for complete norma with hierarchical structure."""
    id: int
    infoleg_id: int
    jurisdiccion: Optional[str] = None
    clase_norma: Optional[str] = None
    tipo_norma: Optional[str] = None
    sancion: Optional[date] = None
    id_normas: Optional[List[Dict[str, Any]]] = None
    publicacion: Optional[date] = None
    titulo_sumario: Optional[str] = None
    titulo_resumido: Optional[str] = None
    observaciones: Optional[str] = None
    nro_boletin: Optional[str] = None
    pag_boletin: Optional[str] = None
    texto_resumido: Optional[str] = None
    texto_norma: Optional[str] = None
    texto_norma_actualizado: Optional[str] = None
    estado: Optional[str] = None
    lista_normas_que_complementa: Optional[List[int]] = None
    lista_normas_que_la_complementan: Optional[List[int]] = None
    purified_texto_norma: Optional[str] = None
    purified_texto_norma_actualizado: Optional[str] = None
    embedding_model: Optional[str] = None
    embedding_source: Optional[str] = None
    embedded_at: Optional[datetime] = None
    embedding_type: Optional[str] = None
    llm_model_used: Optional[str] = None
    llm_models_used: Optional[List[str]] = None
    llm_tokens_used: Optional[int] = None
    llm_processing_time: Optional[float] = None
    llm_similarity_score: Optional[float] = None
    inserted_at: datetime
    created_at: datetime
    updated_at: datetime
    divisions: List["DivisionResponse"] = []
    referencia: Optional[NormaReferenciaResponse] = None


class ArticleResponse(BaseModel):
    """Schema for article response."""
    id: int
    ordinal: Optional[str] = None
    body: str
    order_index: Optional[int] = None
    created_at: datetime
    child_articles: List["ArticleResponse"] = []


class DivisionResponse(BaseModel):
    """Schema for division response."""
    id: int
    name: Optional[str] = None
    ordinal: Optional[str] = None
    title: Optional[str] = None
    body: Optional[str] = None
    order_index: Optional[int] = None
    created_at: datetime
    articles: List[ArticleResponse] = []
    child_divisions: List["DivisionResponse"] = []


class NormaStatsResponse(BaseModel):
    """Schema for norma statistics response."""
    total_normas: int
    total_divisions: int
    total_articles: int
    normas_by_jurisdiction: Dict[str, int]
    normas_by_type: Dict[str, int]
    normas_by_status: Dict[str, int]


class ErrorResponse(BaseModel):
    """Schema for error responses."""
    error: str
    detail: Optional[str] = None
    status_code: int


# Update forward references
ArticleResponse.model_rebuild()
DivisionResponse.model_rebuild()
NormaDetailResponse.model_rebuild()
