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
        print(rows)  # Debugging line
        data = []
        for r in rows:
            label = str(r[0]) if r[0] is not None else "Desconocido"
            count = r[1] if r[1] is not None else 0
            data.append({"label": label, "count": count})
        return data
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
                SELECT tn.nombre AS label, COUNT(*) AS count
                FROM normas n
                JOIN tipos_norma tn ON n.tipo_norma_id = tn.id
                GROUP BY tn.nombre
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
                       tn.nombre                AS tipo_norma,
                       n.numero_norma,
                       n.titulo_resumido
                FROM relaciones_normativas r
                JOIN normas n ON n.id_norma = r.norma_modificadora
                JOIN tipos_norma tn ON n.tipo_norma_id = tn.id
                GROUP BY r.norma_modificadora, tn.nombre, n.numero_norma, n.titulo_resumido
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
        data = []
        for r in rows:
            label = str(r[0]) if r[0] is not None else "0"
            count = r[1] if r[1] is not None else 0
            data.append({"label": label, "count": count})
        return data
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
    
