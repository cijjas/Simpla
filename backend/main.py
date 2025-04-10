from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, List, Any

from db import get_db
from algorithms.cycle_detection import detectar_ciclos_sql, detectar_ciclos_networkx
from algorithms.gap_analysis import detectar_posibles_agujeros

app = FastAPI(title="Análisis Normativo", 
              description="API para detectar loops y agujeros legales en la normativa")

@app.get("/")
def read_root():
    return {"message": "API de Análisis Normativo - Ministerio de Desregulación"}

@app.get("/api/normas/{id_norma}/relaciones")
def obtener_relaciones_norma(id_norma: str, db: Session = Depends(get_db)):
    """
    Obtiene todas las relaciones entrantes y salientes de una norma específica
    """
    try:
        # Verificar si la norma existe
        norma = db.execute(
            text("SELECT id_norma FROM normas WHERE id_norma = :id"),
            {"id": id_norma}
        ).fetchone()
        if not norma:
            raise HTTPException(status_code=404, detail=f"Norma {id_norma} no encontrada")
        
        # Obtener relaciones salientes (esta norma modifica a otras)
        query_salientes = text("""
        SELECT 
            r.norma_modificada, 
            n.tipo_norma, 
            n.numero_norma, 
            n.fecha_sancion, 
            n.titulo_resumido,
            r.tipo_relacion
        FROM relaciones_normativas r
        JOIN normas n ON r.norma_modificada = n.id_norma
        WHERE r.norma_modificadora = :id
        """)
        
        # Obtener relaciones entrantes (esta norma es modificada por otras)
        query_entrantes = text("""
        SELECT 
            r.norma_modificadora, 
            n.tipo_norma, 
            n.numero_norma, 
            n.fecha_sancion, 
            n.titulo_resumido,
            r.tipo_relacion
        FROM relaciones_normativas r
        JOIN normas n ON r.norma_modificadora = n.id_norma
        WHERE r.norma_modificada = :id
        """)
        
        relaciones_salientes = []
        for row in db.execute(query_salientes, {"id": id_norma}):
            relaciones_salientes.append({
                "id_norma": row[0],
                "tipo": row[1],
                "numero": row[2],
                "fecha_sancion": row[3].isoformat() if row[3] else None,
                "titulo": row[4],
                "tipo_relacion": row[5]
            })
        
        relaciones_entrantes = []
        for row in db.execute(query_entrantes, {"id": id_norma}):
            relaciones_entrantes.append({
                "id_norma": row[0],
                "tipo": row[1],
                "numero": row[2],
                "fecha_sancion": row[3].isoformat() if row[3] else None,
                "titulo": row[4],
                "tipo_relacion": row[5]
            })
        
        # Obtener datos de la norma
        row = db.execute(
            text("""
            SELECT 
                id_norma, 
                tipo_norma, 
                numero_norma, 
                organismo_origen,
                fecha_sancion, 
                titulo_resumido
            FROM normas
            WHERE id_norma = :id
            """),
            {"id": id_norma}
        ).fetchone()
        
        norma_data = {}
        if row:
            norma_data = {
                "id_norma": row[0],
                "tipo": row[1],
                "numero": row[2],
                "organismo": row[3],
                "fecha_sancion": row[4].isoformat() if row[4] else None,
                "titulo": row[5]
            }
        
        return {
            "norma": norma_data,
            "relaciones_salientes": relaciones_salientes,
            "relaciones_entrantes": relaciones_entrantes
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener relaciones: {str(e)}")

@app.get("/api/ciclos", response_model=Dict[str, List[Dict[str, Any]]])
def obtener_ciclos(db: Session = Depends(get_db)):
    """
    Detecta ciclos normativos - secuencias de modificaciones que forman un bucle
    """
    try:
        # Usar algoritmo SQL para datasets grandes
        ciclos = detectar_ciclos_sql(db)
        return {"ciclos": ciclos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al detectar ciclos: {str(e)}")

@app.get("/api/agujeros", response_model=Dict[str, List[Dict[str, Any]]])
def obtener_agujeros(db: Session = Depends(get_db)):
    """
    Detecta posibles agujeros legales basados en patrones específicos
    """
    try:
        agujeros = detectar_posibles_agujeros(db)
        return agujeros
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al detectar agujeros: {str(e)}")