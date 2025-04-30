from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any
from pydantic import BaseModel
from db.deps import get_db

router = APIRouter(
    prefix="/api/stats",
    tags=["stats"]
)

# ─────────────────────────────── Schema ───────────────────────────────

class CountByLabel(BaseModel):
    label: str
    count: int

# ────────────────────────────── Endpoints ──────────────────────────────

@router.get("/overview")
def stats_overview(db: Session = Depends(get_db)):
    try:
        totals = db.execute(
            text("""
                SELECT
                  (SELECT COUNT(*) FROM normas)                           AS total_normas,
                  (SELECT COUNT(*) FROM relaciones_normativas)           AS total_relaciones,
                  (SELECT COUNT(*) FROM organismos)                      AS total_organismos,
                  (SELECT COUNT(*) FROM tipos_norma)                     AS total_tipos
            """)
        ).fetchone()
        return {
            "total_normas": totals[0],
            "total_relaciones": totals[1],
            "total_organismos": totals[2],
            "total_tipos_norma": totals[3],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/normas-per-year", response_model=List[CountByLabel])
def normas_por_anio(db: Session = Depends(get_db)):
    try:
        rows = db.execute(
            text("""
                SELECT EXTRACT(YEAR FROM fecha_sancion)::int AS label,
                       COUNT(*) AS count
                FROM normas
                WHERE fecha_sancion IS NOT NULL
                GROUP BY label
                ORDER BY label
            """)
        )
        return [{"label": str(r[0]), "count": r[1]} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/normas-per-type", response_model=List[CountByLabel])
def normas_por_tipo(db: Session = Depends(get_db)):
    try:
        rows = db.execute(
            text("""
                SELECT tn.nombre AS label, COUNT(*) AS count
                FROM normas n
                JOIN tipos_norma tn ON n.tipo_norma_id = tn.id
                GROUP BY tn.nombre
                ORDER BY count DESC
            """)
        )
        return [{"label": r[0], "count": r[1]} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/top-modifiers", response_model=List[Dict[str, Any]])
def top_modificadoras(limit: int = 10, db: Session = Depends(get_db)):
    try:
        rows = db.execute(
            text("""
                SELECT r.norma_modificadora AS id_norma,
                       COUNT(*) AS total_modifica,
                       tn.nombre AS tipo_norma,
                       n.numero_norma,
                       n.titulo_resumido
                FROM relaciones_normativas r
                JOIN normas n ON n.id_norma = r.norma_modificadora
                JOIN tipos_norma tn ON n.tipo_norma_id = tn.id
                GROUP BY r.norma_modificadora, tn.nombre, n.numero_norma, n.titulo_resumido
                ORDER BY total_modifica DESC
                LIMIT :lim
            """), {"lim": limit}
        )
        return [{
            "id_norma": r[0], "total_modifica": r[1], "tipo": r[2],
            "numero": r[3], "titulo": r[4]
        } for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/modifications-distribution", response_model=List[CountByLabel])
def distribucion_modificaciones(db: Session = Depends(get_db)):
    try:
        rows = db.execute(
            text("""
                SELECT modificada_por_count AS label, COUNT(*) AS count
                FROM normas
                GROUP BY modificada_por_count
                ORDER BY label
            """)
        )
        return [{"label": str(r[0]), "count": r[1]} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/normas-per-organismo", response_model=List[CountByLabel])
def normas_por_organismo(db: Session = Depends(get_db)):
    try:
        rows = db.execute(
            text("""
                SELECT o.nombre AS label, COUNT(*) AS count
                FROM normas n
                JOIN organismos o ON o.id = n.organismo_id
                GROUP BY o.nombre
                ORDER BY count DESC
            """)
        )
        return [{"label": r[0], "count": r[1]} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/top-modified", response_model=List[Dict[str, Any]])
def top_modificadas(limit: int = 10, db: Session = Depends(get_db)):
    q = """
        SELECT r.norma_modificada AS id_norma,
               COUNT(*) AS total_recibe,
               tn.nombre AS tipo_norma,
               n.numero_norma,
               n.titulo_resumido
        FROM relaciones_normativas r
        JOIN normas n ON n.id_norma = r.norma_modificada
        JOIN tipos_norma tn ON n.tipo_norma_id = tn.id
        GROUP BY r.norma_modificada, tn.nombre, n.numero_norma, n.titulo_resumido
        ORDER BY total_recibe DESC
        LIMIT :lim
    """
    rows = db.execute(text(q), {"lim": limit})
    return [{
        "id_norma": r[0], "total_recibe": r[1],
        "tipo": r[2], "numero": r[3], "titulo": r[4]
    } for r in rows]


@router.get("/modificaciones-per-year", response_model=List[CountByLabel])
def modificaciones_por_anio(db: Session = Depends(get_db)):
    q = """
        SELECT EXTRACT(YEAR FROM n.fecha_sancion)::int AS label,
               COUNT(*) AS count
        FROM relaciones_normativas r
        JOIN normas n ON n.id_norma = r.norma_modificadora
        WHERE n.fecha_sancion IS NOT NULL
        GROUP BY label
        ORDER BY label
    """
    rows = db.execute(text(q))
    return [{"label": str(r[0]), "count": r[1]} for r in rows]


@router.get("/avg-mods-per-type", response_model=List[Dict[str, Any]])
def promedio_mods_por_tipo(db: Session = Depends(get_db)):
    q = """
        SELECT tn.nombre AS tipo,
               AVG(n.modificada_por_count)::float AS avg_mods
        FROM normas n
        JOIN tipos_norma tn ON tn.id = n.tipo_norma_id
        GROUP BY tn.nombre
        ORDER BY avg_mods DESC
    """
    rows = db.execute(text(q))
    return [{"tipo": r[0], "avg_mods": round(r[1], 2)} for r in rows]


@router.get("/publication-delay", response_model=List[CountByLabel])
def demora_publicacion(db: Session = Depends(get_db)):
    q = """
        SELECT EXTRACT(YEAR FROM fecha_sancion)::int AS label,
               AVG(DATE_PART('day', fecha_boletin - fecha_sancion))::int AS count
        FROM normas
        WHERE fecha_sancion IS NOT NULL AND fecha_boletin IS NOT NULL
        GROUP BY label
        ORDER BY label
    """
    rows = db.execute(text(q))
    return [{"label": str(r[0]), "count": r[1]} for r in rows]


@router.get("/untouched-vs-modified", response_model=Dict[str, int])
def intactas_vs_modificadas(db: Session = Depends(get_db)):
    q = """
        SELECT
            SUM(CASE WHEN modificada_por_count = 0 THEN 1 ELSE 0 END) AS intactas,
            SUM(CASE WHEN modificada_por_count > 0 THEN 1 ELSE 0 END) AS modificadas
        FROM normas
    """
    r = db.execute(text(q)).fetchone()
    return {"intactas": r[0], "modificadas": r[1]}