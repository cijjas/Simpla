from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List, Any
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from pydantic import BaseModel

from db import get_db
from algorithms.cycle_detection import detectar_ciclos_sql, detectar_ciclos_networkx
from algorithms.gap_analysis import detectar_posibles_agujeros

app = FastAPI(title="Análisis Normativo", 
              description="API para detectar loops y agujeros legales en la normativa")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Or ["*"] for dev/testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
        norma = db.execute(f"SELECT id_norma FROM normas WHERE id_norma = '{id_norma}'").fetchone()
        if not norma:
            raise HTTPException(status_code=404, detail=f"Norma {id_norma} no encontrada")
        
        # Obtener relaciones salientes (esta norma modifica a otras)
        query_salientes = f"""
        SELECT 
            r.norma_modificada, 
            n.tipo_norma, 
            n.numero_norma, 
            n.fecha_sancion, 
            n.titulo_resumido,
            r.tipo_relacion
        FROM relaciones_normativas r
        JOIN normas n ON r.norma_modificada = n.id_norma
        WHERE r.norma_modificadora = '{id_norma}'
        """
        
        # Obtener relaciones entrantes (esta norma es modificada por otras)
        query_entrantes = f"""
        SELECT 
            r.norma_modificadora, 
            n.tipo_norma, 
            n.numero_norma, 
            n.fecha_sancion, 
            n.titulo_resumido,
            r.tipo_relacion
        FROM relaciones_normativas r
        JOIN normas n ON r.norma_modificadora = n.id_norma
        WHERE r.norma_modificada = '{id_norma}'
        """
        
        relaciones_salientes = []
        for row in db.execute(query_salientes):
            relaciones_salientes.append({
                "id_norma": row[0],
                "tipo": row[1],
                "numero": row[2],
                "fecha_sancion": row[3].isoformat() if row[3] else None,
                "titulo": row[4],
                "tipo_relacion": row[5]
            })
        
        relaciones_entrantes = []
        for row in db.execute(query_entrantes):
            relaciones_entrantes.append({
                "id_norma": row[0],
                "tipo": row[1],
                "numero": row[2],
                "fecha_sancion": row[3].isoformat() if row[3] else None,
                "titulo": row[4],
                "tipo_relacion": row[5]
            })
        
        # Obtener datos de la norma
        query_norma = f"""
        SELECT 
            id_norma, 
            tipo_norma, 
            numero_norma, 
            organismo_origen,
            fecha_sancion, 
            titulo_resumido
        FROM normas
        WHERE id_norma = '{id_norma}'
        """
        
        norma_data = {}
        row = db.execute(query_norma).fetchone()
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

# ─────────────────────────────  Stats & dashboards  ──────────────────────────
class CountByLabel(BaseModel):
    label: str
    count: int

@app.get("/api/stats/overview")
def stats_overview(db: Session = Depends(get_db)):
    """
    Devuelve métricas globales de la base:
    total de normas, total de relaciones, total de organismos y tipos de norma.
    """
    try:
        totals = db.execute(
            text(
                """
                SELECT
                  (SELECT COUNT(*) FROM normas)                           AS total_normas,
                  (SELECT COUNT(*) FROM relaciones_normativas)           AS total_relaciones,
                  (SELECT COUNT(*) FROM organismos)                      AS total_organismos,
                  (SELECT COUNT(*) FROM tipos_norma)                     AS total_tipos
                """
            )
        ).fetchone()
        return {
            "total_normas": totals[0],
            "total_relaciones": totals[1],
            "total_organismos": totals[2],
            "total_tipos_norma": totals[3],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/normas-per-year", response_model=List[CountByLabel])
def normas_por_anio(db: Session = Depends(get_db)):
    """
    Cantidad de normas sancionadas por año (para series de tiempo/histogramas).
    """
    try:
        rows = db.execute(
            text(
                """
                SELECT EXTRACT(YEAR FROM fecha_sancion)::int  AS label,
                       COUNT(*)                               AS count
                FROM normas
                WHERE fecha_sancion IS NOT NULL
                GROUP BY label
                ORDER BY label
                """
            )
        )
        return [{"label": int(r[0]), "count": r[1]} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/normas-per-type", response_model=List[CountByLabel])
def normas_por_tipo(db: Session = Depends(get_db)):
    """
    Cantidad de normas agrupadas por tipo_norma.
    """
    try:
        rows = db.execute(
            text(
                """
                SELECT tipo_norma AS label, COUNT(*) AS count
                FROM normas
                GROUP BY tipo_norma
                ORDER BY count DESC
                """
            )
        )
        return [{"label": r[0], "count": r[1]} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/top-modifiers", response_model=List[Dict[str, Any]])
def top_modificadoras(limit: int = 10, db: Session = Depends(get_db)):
    """
    Normas que modifican a más normas (top N).
    """
    try:
        rows = db.execute(
            text(
                """
                SELECT r.norma_modificadora     AS id_norma,
                       COUNT(*)                 AS total_modifica,
                       n.tipo_norma,
                       n.numero_norma,
                       n.titulo_resumido
                FROM relaciones_normativas r
                JOIN normas n ON n.id_norma = r.norma_modificadora
                GROUP BY r.norma_modificadora, n.tipo_norma, n.numero_norma, n.titulo_resumido
                ORDER BY total_modifica DESC
                LIMIT :lim
                """
            ),
            {"lim": limit},
        )
        return [
            {
                "id_norma": r[0],
                "total_modifica": r[1],
                "tipo": r[2],
                "numero": r[3],
                "titulo": r[4],
            }
            for r in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/modifications-distribution", response_model=List[CountByLabel])
def distribucion_modificaciones(db: Session = Depends(get_db)):
    """
    Histograma: cuántas normas han sido modificadas X veces.
    """
    try:
        rows = db.execute(
            text(
                """
                SELECT modificada_por_count AS label, COUNT(*) AS count
                FROM normas
                GROUP BY modificada_por_count
                ORDER BY label
                """
            )
        )
        return [{"label": int(r[0]), "count": r[1]} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/normas-per-organismo", response_model=List[CountByLabel])
def normas_por_organismo(db: Session = Depends(get_db)):
    """
    Cantidad de normas emitidas por cada organismo.
    """
    try:
        rows = db.execute(
            text(
                """
                SELECT o.nombre AS label, COUNT(*) AS count
                FROM normas n
                JOIN organismos o ON o.id = n.organismo_id
                GROUP BY o.nombre
                ORDER BY count DESC
                """
            )
        )
        return [{"label": r[0], "count": r[1]} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


# ─────────────────────────────  Stats & dashboards  ──────────────────────────
class CountByLabel(BaseModel):
    label: str
    count: int

@app.get("/api/stats/overview")
def stats_overview(db: Session = Depends(get_db)):
    """
    Devuelve métricas globales de la base:
    total de normas, total de relaciones, total de organismos y tipos de norma.
    """
    try:
        totals = db.execute(
            text(
                """
                SELECT
                  (SELECT COUNT(*) FROM normas)                           AS total_normas,
                  (SELECT COUNT(*) FROM relaciones_normativas)           AS total_relaciones,
                  (SELECT COUNT(*) FROM organismos)                      AS total_organismos,
                  (SELECT COUNT(*) FROM tipos_norma)                     AS total_tipos
                """
            )
        ).fetchone()
        return {
            "total_normas": totals[0],
            "total_relaciones": totals[1],
            "total_organismos": totals[2],
            "total_tipos_norma": totals[3],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/normas-per-year", response_model=List[CountByLabel])
def normas_por_anio(db: Session = Depends(get_db)):
    """
    Cantidad de normas sancionadas por año (para series de tiempo/histogramas).
    """
    try:
        rows = db.execute(
            text(
                """
                SELECT EXTRACT(YEAR FROM fecha_sancion)::int  AS label,
                       COUNT(*)                               AS count
                FROM normas
                WHERE fecha_sancion IS NOT NULL
                GROUP BY label
                ORDER BY label
                """
            )
        )
        return [{"label": int(r[0]), "count": r[1]} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/normas-per-type", response_model=List[CountByLabel])
def normas_por_tipo(db: Session = Depends(get_db)):
    """
    Cantidad de normas agrupadas por tipo_norma.
    """
    try:
        rows = db.execute(
            text(
                """
                SELECT tipo_norma AS label, COUNT(*) AS count
                FROM normas
                GROUP BY tipo_norma
                ORDER BY count DESC
                """
            )
        )
        return [{"label": r[0], "count": r[1]} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/top-modifiers", response_model=List[Dict[str, Any]])
def top_modificadoras(limit: int = 10, db: Session = Depends(get_db)):
    """
    Normas que modifican a más normas (top N).
    """
    try:
        rows = db.execute(
            text(
                """
                SELECT r.norma_modificadora     AS id_norma,
                       COUNT(*)                 AS total_modifica,
                       n.tipo_norma,
                       n.numero_norma,
                       n.titulo_resumido
                FROM relaciones_normativas r
                JOIN normas n ON n.id_norma = r.norma_modificadora
                GROUP BY r.norma_modificadora, n.tipo_norma, n.numero_norma, n.titulo_resumido
                ORDER BY total_modifica DESC
                LIMIT :lim
                """
            ),
            {"lim": limit},
        )
        return [
            {
                "id_norma": r[0],
                "total_modifica": r[1],
                "tipo": r[2],
                "numero": r[3],
                "titulo": r[4],
            }
            for r in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/modifications-distribution", response_model=List[CountByLabel])
def distribucion_modificaciones(db: Session = Depends(get_db)):
    """
    Histograma: cuántas normas han sido modificadas X veces.
    """
    try:
        rows = db.execute(
            text(
                """
                SELECT modificada_por_count AS label, COUNT(*) AS count
                FROM normas
                GROUP BY modificada_por_count
                ORDER BY label
                """
            )
        )
        return [{"label": int(r[0]), "count": r[1]} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/normas-per-organismo", response_model=List[CountByLabel])
def normas_por_organismo(db: Session = Depends(get_db)):
    """
    Cantidad de normas emitidas por cada organismo.
    """
    try:
        rows = db.execute(
            text(
                """
                SELECT o.nombre AS label, COUNT(*) AS count
                FROM normas n
                JOIN organismos o ON o.id = n.organismo_id
                GROUP BY o.nombre
                ORDER BY count DESC
                """
            )
        )
        return [{"label": r[0], "count": r[1]} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))