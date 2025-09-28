"""SQLAlchemy models for legal norms, divisions, and articles."""

from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database.base import Base


class NormaStructured(Base):
    """Model for structured legal norms."""
    
    __tablename__ = "normas_structured"
    
    id = Column(Integer, primary_key=True, index=True)
    infoleg_id = Column(Integer, unique=True, nullable=False, index=True)
    jurisdiccion = Column(String(255))
    clase_norma = Column(String(255))
    tipo_norma = Column(String(255))
    sancion = Column(Date)
    id_normas = Column(JSON)
    publicacion = Column(Date)
    titulo_sumario = Column(Text)
    titulo_resumido = Column(Text)
    observaciones = Column(Text)
    nro_boletin = Column(String(255))
    pag_boletin = Column(String(255))
    texto_resumido = Column(Text)
    texto_norma = Column(Text)
    texto_norma_actualizado = Column(Text)
    estado = Column(String(255))
    lista_normas_que_complementa = Column(JSON)
    lista_normas_que_la_complementan = Column(JSON)
    purified_texto_norma = Column(Text)
    purified_texto_norma_actualizado = Column(Text)
    embedding_model = Column(String(255))
    embedding_source = Column(String(255))
    embedded_at = Column(DateTime)
    embedding_type = Column(String(255))
    llm_model_used = Column(String(255))
    llm_models_used = Column(JSON)
    llm_tokens_used = Column(Integer)
    llm_processing_time = Column(Integer)
    llm_similarity_score = Column(Integer)
    inserted_at = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    divisions = relationship("Division", back_populates="norma", cascade="all, delete-orphan")


class Division(Base):
    """Model for legal norm divisions (chapters, sections, etc.)."""
    
    __tablename__ = "divisions"
    
    id = Column(Integer, primary_key=True, index=True)
    norma_id = Column(Integer, ForeignKey("normas_structured.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_division_id = Column(Integer, ForeignKey("divisions.id", ondelete="CASCADE"), index=True)
    name = Column(String(255))
    ordinal = Column(String(50))
    title = Column(Text)
    body = Column(Text)
    order_index = Column(Integer, index=True)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    norma = relationship("NormaStructured", back_populates="divisions")
    parent_division = relationship("Division", remote_side=[id], back_populates="child_divisions")
    child_divisions = relationship("Division", back_populates="parent_division", cascade="all, delete-orphan")
    articles = relationship("Article", back_populates="division", cascade="all, delete-orphan")


class Article(Base):
    """Model for legal norm articles."""
    
    __tablename__ = "articles"
    
    id = Column(Integer, primary_key=True, index=True)
    division_id = Column(Integer, ForeignKey("divisions.id", ondelete="CASCADE"), index=True)
    parent_article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"), index=True)
    ordinal = Column(String(50))
    body = Column(Text, nullable=False)
    order_index = Column(Integer, index=True)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    division = relationship("Division", back_populates="articles")
    parent_article = relationship("Article", remote_side=[id], back_populates="child_articles")
    child_articles = relationship("Article", back_populates="parent_article", cascade="all, delete-orphan")
