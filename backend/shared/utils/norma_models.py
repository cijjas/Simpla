"""Shared Pydantic models for normas, divisions, and articles."""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, date


class NormaReferenciaModel(BaseModel):
    """Model for norma reference information (numero, dependencia, etc)."""
    id: int
    norma_id: int
    numero: int
    dependencia: Optional[str] = None
    rama_digesto: Optional[str] = None
    created_at: datetime


class ArticleModel(BaseModel):
    """Model for a legal article within a division."""
    id: int
    ordinal: Optional[str] = None
    body: str
    order_index: Optional[int] = None
    created_at: datetime
    child_articles: List['ArticleModel'] = []


class DivisionModel(BaseModel):
    """Model for a legal division within a norma."""
    id: int
    name: Optional[str] = None
    ordinal: Optional[str] = None
    title: Optional[str] = None
    body: Optional[str] = None
    order_index: Optional[int] = None
    created_at: datetime
    articles: List[ArticleModel] = []
    child_divisions: List['DivisionModel'] = []


class NormaStructuredModel(BaseModel):
    """Model for a complete legal norma with its hierarchical structure."""
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
    divisions: List[DivisionModel] = []
    referencia: Optional[NormaReferenciaModel] = None


# Update forward references
ArticleModel.model_rebuild()
DivisionModel.model_rebuild()