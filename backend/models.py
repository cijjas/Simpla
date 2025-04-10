from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from db import Base

class Norma(Base):
    __tablename__ = "normas"
    
    id_norma = Column(String, primary_key=True)
    tipo_norma = Column(String)
    numero_norma = Column(String)
    clase_norma = Column(String)
    organismo_origen = Column(String)
    fecha_sancion = Column(Date)
    numero_boletin = Column(String)
    fecha_boletin = Column(Date)
    pagina_boletin = Column(String)
    titulo_resumido = Column(Text)
    titulo_sumario = Column(Text)
    texto_resumido = Column(Text)
    observaciones = Column(Text)
    texto_original = Column(Text)
    texto_actualizado = Column(Text)
    modificada_por = Column(Text)
    modifica_a = Column(Text)
    
    # Relaciones
    modificaciones_realizadas = relationship("RelacionNormativa", 
                                          foreign_keys="RelacionNormativa.norma_modificadora",
                                          back_populates="norma_origen")
    modificaciones_recibidas = relationship("RelacionNormativa", 
                                         foreign_keys="RelacionNormativa.norma_modificada",
                                         back_populates="norma_destino")

class RelacionNormativa(Base):
    __tablename__ = "relaciones_normativas"
    
    id = Column(Integer, primary_key=True)
    norma_modificadora = Column(String, ForeignKey("normas.id_norma"))
    norma_modificada = Column(String, ForeignKey("normas.id_norma"))
    tipo_relacion = Column(String, default="modifica")
    
    # Relaciones
    norma_origen = relationship("Norma", foreign_keys=[norma_modificadora], back_populates="modificaciones_realizadas")
    norma_destino = relationship("Norma", foreign_keys=[norma_modificada], back_populates="modificaciones_recibidas")
    
    __table_args__ = (
        UniqueConstraint('norma_modificadora', 'norma_modificada', 'tipo_relacion', name='uq_relacion_normativa'),
    )