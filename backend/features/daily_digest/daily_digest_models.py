"""Database models for daily digest feature."""

from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, Text, Date, ForeignKey, text, ARRAY, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from core.database.base import Base
import uuid


class DigestPreferences(Base):
    """Model for user daily digest preferences."""
    
    __tablename__ = "digest_preferences"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    dependencia_ids = Column(ARRAY(UUID(as_uuid=True)), nullable=False, default=text("ARRAY[]::uuid[]"))
    
    # Relationships
    # user = relationship("User", backref="daily_digest_preferences")


class DailyDigestOrganismSummary(Base):
    """Model for storing organism-level summaries for daily digest."""
    
    __tablename__ = "daily_digest_summaries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organism_id = Column(String, nullable=False, index=True)  # Root organism ID (nivel=1)
    summary = Column(Text, nullable=False)
    summary_date = Column(Date, nullable=False, index=True)  # Date the summary was generated for
    norma_count = Column(Integer, nullable=False, default=0)  # Number of normas in this summary
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    __table_args__ = (
        # Unique constraint to prevent duplicate summaries for the same organism on the same date
        {'schema': None},
    )


class NormaSummaryAnalysis(Base):
    """Model for storing individual norma summaries with analysis for newspaper-style digest."""
    
    __tablename__ = "norma_summary_analysis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    infoleg_id = Column(Integer, nullable=False, index=True)
    summary_date = Column(Date, nullable=False, index=True)
    resumen = Column(Text, nullable=False)
    puntaje_impacto = Column(Integer, nullable=False)  # 1-10 impact score
    tema_editorial = Column(String, nullable=False)  # Editorial theme category
    tipo_norma = Column(String, nullable=False)
    clase_norma = Column(String)
    titulo_sumario = Column(Text)
    dependencia = Column(String)
    raw_norma_data = Column(JSONB, nullable=False)  # Store full norma data for reference
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    __table_args__ = (
        # Unique constraint to prevent duplicate analysis for the same norma on the same date
        {'schema': None},
    )


class DailyDigestNewspaper(Base):
    """Model for storing the final newspaper-style daily digest sections."""
    
    __tablename__ = "daily_digest_newspaper"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    digest_date = Column(Date, nullable=False, index=True)
    section_type = Column(String, nullable=False)  # 'hero', 'secondary', or theme name
    section_content = Column(Text, nullable=False)  # Generated LLM content for this section
    norma_ids = Column(ARRAY(Integer), nullable=False)  # Array of infoleg_ids included in this section
    section_order = Column(Integer, nullable=False, default=0)  # Order for displaying sections
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    __table_args__ = (
        # Unique constraint to prevent duplicate sections for the same date and type
        {'schema': None},
    )