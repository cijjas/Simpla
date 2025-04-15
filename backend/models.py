"""
Declarative models for the InfoLeg database
===========================================
• Postgres‑flavoured types (BigInteger, Text, etc.)
• Relationship helpers on Norma <‑‑> RelacionNormativa
• Timestamp columns auto‑maintained by the DB
"""

from sqlalchemy import (
    Column,
    Integer,
    BigInteger,
    String,
    Date,
    DateTime,
    Text,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from db import Base  # your existing declarative_base()

# ---------- Lookup tables -------------------------------------------------- #

class TipoNorma(Base):
    __tablename__ = "tipo_norma"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    normas: Mapped[list["Norma"]] = relationship(back_populates="tipo_norma")


class ClaseNorma(Base):
    __tablename__ = "clase_norma"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    normas: Mapped[list["Norma"]] = relationship(back_populates="clase_norma")


class Organismo(Base):
    __tablename__ = "organismo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    normas: Mapped[list["Norma"]] = relationship(back_populates="organismo")


class TipoRelacion(Base):
    __tablename__ = "tipo_relacion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    relaciones: Mapped[list["RelacionNormativa"]] = relationship(
        back_populates="tipo_relacion"
    )

# ---------- Fact table ----------------------------------------------------- #

class Norma(Base):
    __tablename__ = "norma"

    id_norma: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=False
    )
    tipo_norma_id: Mapped[int] = mapped_column(ForeignKey("tipo_norma.id"))
    numero_norma: Mapped[str | None] = mapped_column(String)
    clase_norma_id: Mapped[int | None] = mapped_column(ForeignKey("clase_norma.id"))
    organismo_id: Mapped[int | None] = mapped_column(ForeignKey("organismo.id"))
    fecha_sancion: Mapped[Date | None] = mapped_column(Date)
    numero_boletin: Mapped[str | None] = mapped_column(String)
    fecha_boletin: Mapped[Date | None] = mapped_column(Date)
    pagina_boletin: Mapped[str | None] = mapped_column(String)
    titulo_resumido: Mapped[str | None] = mapped_column(Text)
    titulo_sumario: Mapped[str | None] = mapped_column(Text)
    texto_resumido: Mapped[str | None] = mapped_column(Text)
    observaciones: Mapped[str | None] = mapped_column(Text)
    texto_original: Mapped[str | None] = mapped_column(Text)
    texto_actualizado: Mapped[str | None] = mapped_column(Text)

    # ← NEW: these are simple counters, **not** FK lists
    modificada_por_count: Mapped[int | None] = mapped_column(Integer)
    modifica_a_count: Mapped[int | None] = mapped_column(Integer)

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # ----- relationships -----
    tipo_norma: Mapped["TipoNorma"] = relationship(back_populates="normas")
    clase_norma: Mapped["ClaseNorma"] = relationship(back_populates="normas")
    organismo: Mapped["Organismo"] = relationship(back_populates="normas")

    modificaciones_realizadas: Mapped[list["RelacionNormativa"]] = relationship(
        "RelacionNormativa",
        foreign_keys="RelacionNormativa.norma_modificatoria_id",
        back_populates="norma_modificatoria",
        cascade="all, delete-orphan",
    )
    modificaciones_recibidas: Mapped[list["RelacionNormativa"]] = relationship(
        "RelacionNormativa",
        foreign_keys="RelacionNormativa.norma_modificada_id",
        back_populates="norma_modificada",
        cascade="all, delete-orphan",
    )

# ---------- Bridge table --------------------------------------------------- #

class RelacionNormativa(Base):
    __tablename__ = "relacion_normativa"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    norma_modificatoria_id: Mapped[int] = mapped_column(
        ForeignKey("norma.id_norma", ondelete="CASCADE")
    )
    norma_modificada_id: Mapped[int] = mapped_column(
        ForeignKey("norma.id_norma", ondelete="CASCADE")
    )
    tipo_relacion_id: Mapped[int] = mapped_column(
        ForeignKey("tipo_relacion.id"), default=1  # 1 = "modifica" seeded at init
    )

    # ----- relationships -----
    norma_modificatoria: Mapped["Norma"] = relationship(
        foreign_keys=[norma_modificatoria_id], back_populates="modificaciones_realizadas"
    )
    norma_modificada: Mapped["Norma"] = relationship(
        foreign_keys=[norma_modificada_id], back_populates="modificaciones_recibidas"
    )
    tipo_relacion: Mapped["TipoRelacion"] = relationship(back_populates="relaciones")

    __table_args__ = (
        UniqueConstraint(
            "norma_modificatoria_id",
            "norma_modificada_id",
            "tipo_relacion_id",
            name="uq_relacion_normativa",
        ),
    )