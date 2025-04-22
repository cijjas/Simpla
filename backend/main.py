from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List, Any
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from pydantic import BaseModel

from db import get_db
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


# ────────────────  6. Top N normas más modificadas  ─────────────────────────
@app.get("/api/stats/top-modified", response_model=List[Dict[str, Any]])
def top_modificadas(limit: int = 10, db: Session = Depends(get_db)):
    """
    Normas que HAN SIDO modificadas por la mayor cantidad de otras normas.
    """
    q = """
        SELECT r.norma_modificada       AS id_norma,
               COUNT(*)                 AS total_recibe,
               tn.nombre                AS tipo_norma,
               n.numero_norma,
               n.titulo_resumido
        FROM relaciones_normativas r
        JOIN normas n  ON n.id_norma = r.norma_modificada
        JOIN tipos_norma tn ON n.tipo_norma_id = tn.id
        GROUP BY r.norma_modificada, tn.nombre, n.numero_norma, n.titulo_resumido
        ORDER BY total_recibe DESC
        LIMIT :lim
    """
    rows = db.execute(text(q), {"lim": limit})
    return [{"id_norma": r[0], "total_recibe": r[1],
             "tipo": r[2], "numero": r[3], "titulo": r[4]} for r in rows]


# ────────────────  7. Modificaciones emitidas por año  ──────────────────────
@app.get("/api/stats/modificaciones-per-year", response_model=List[CountByLabel])
def modificaciones_por_anio(db: Session = Depends(get_db)):
    """
    Número de *relaciones* (enmiendas) creadas por año.
    """
    q = """
        SELECT EXTRACT(YEAR FROM n.fecha_sancion)::int AS label,
               COUNT(*)                               AS count
        FROM relaciones_normativas r
        JOIN normas n ON n.id_norma = r.norma_modificadora
        WHERE n.fecha_sancion IS NOT NULL
        GROUP BY label
        ORDER BY label
    """
    return [{"label": str(r[0]), "count": r[1]}
            for r in db.execute(text(q))]


# ────────────────  8. Promedio de modificaciones por tipo  ──────────────────
@app.get("/api/stats/avg-mods-per-type", response_model=List[Dict[str, Any]])
def promedio_mods_por_tipo(db: Session = Depends(get_db)):
    """
    Promedio de veces que cada tipo de norma **ha sido modificado**.
    """
    q = """
        SELECT tn.nombre                           AS tipo,
               AVG(n.modificada_por_count)::float AS avg_mods
        FROM normas n
        JOIN tipos_norma tn ON tn.id = n.tipo_norma_id
        GROUP BY tn.nombre
        ORDER BY avg_mods DESC
    """
    return [{"tipo": r[0], "avg_mods": round(r[1], 2)}
            for r in db.execute(text(q))]


# ────────────────  9. Delay sanción → boletín (días)  ───────────────────────
@app.get("/api/stats/publication-delay", response_model=List[CountByLabel])
def demora_publicacion(db: Session = Depends(get_db)):
    """
    Media de días transcurridos entre `fecha_sancion` y `fecha_boletin`
    agrupada por año de sanción.
    """
    q = """
        SELECT EXTRACT(YEAR FROM fecha_sancion)::int AS label,
               AVG(DATE_PART('day', fecha_boletin - fecha_sancion))::int AS count
        FROM normas
        WHERE fecha_sancion IS NOT NULL
          AND fecha_boletin IS NOT NULL
        GROUP BY label
        ORDER BY label
    """
    return [{"label": str(r[0]), "count": r[1]} for r in db.execute(text(q))]


# ──────────────── 10. Intocables vs modificadas  ────────────────────────────
@app.get("/api/stats/untouched-vs-modified")
def intactas_vs_modificadas(db: Session = Depends(get_db)) -> Dict[str, int]:
    """
    Cuenta cuántas normas jamás fueron modificadas vs. al menos una vez.
    Útil para una tarjeta KPI o donut chart.
    """
    q = """
        SELECT
          SUM(CASE WHEN modificada_por_count = 0 THEN 1 ELSE 0 END) AS intactas,
          SUM(CASE WHEN modificada_por_count > 0 THEN 1 ELSE 0 END) AS modificadas
        FROM normas
    """
    r = db.execute(text(q)).fetchone()
    return {"intactas": r[0], "modificadas": r[1]}
