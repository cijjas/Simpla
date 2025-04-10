from sqlalchemy import text
from sqlalchemy.orm import Session

def detectar_posibles_agujeros(db: Session):
    """
    Identifica posibles agujeros legales basados en patrones específicos
    """
    resultados = {
        "normas_frecuentemente_modificadas": [],
        "referencias_a_normas_derogadas": [],
        "normas_aisladas": []
    }
    
    # Normas frecuentemente modificadas (potencial inestabilidad)
    query1 = text("""
    SELECT 
        n.id_norma, 
        n.tipo, 
        n.numero, 
        n.anio, 
        n.titulo, 
        COUNT(*) as num_modificaciones 
    FROM relaciones_normativas r
    JOIN normas n ON r.norma_modificada = n.id_norma
    WHERE r.tipo_relacion = 'modifica'
    GROUP BY n.id_norma, n.tipo, n.numero, n.anio, n.titulo 
    HAVING COUNT(*) > 5
    ORDER BY num_modificaciones DESC
    LIMIT 100
    """)
    
    result1 = db.execute(query1)
    for row in result1:
        resultados["normas_frecuentemente_modificadas"].append({
            "id_norma": row[0],
            "tipo": row[1],
            "numero": row[2],
            "anio": row[3],
            "titulo": row[4],
            "num_modificaciones": row[5]
        })
    
    # Referencias a normas derogadas
    query2 = text("""
    SELECT 
        n1.id_norma as norma_modificadora_id,
        n1.tipo as norma_modificadora_tipo,
        n1.numero as norma_modificadora_numero,
        n2.id_norma as norma_modificada_id,
        n2.tipo as norma_modificada_tipo,
        n2.numero as norma_modificada_numero,
        r1.fecha_relacion as fecha_modificacion,
        r2.fecha_relacion as fecha_derogacion
    FROM relaciones_normativas r1
    JOIN relaciones_normativas r2 ON r1.norma_modificada = r2.norma_modificada
    JOIN normas n1 ON r1.norma_modificadora = n1.id_norma
    JOIN normas n2 ON r1.norma_modificada = n2.id_norma
    WHERE r2.tipo_relacion = 'deroga' 
    AND r1.fecha_relacion > r2.fecha_relacion
    LIMIT 100
    """)
    
    result2 = db.execute(query2)
    for row in result2:
        resultados["referencias_a_normas_derogadas"].append({
            "norma_modificadora": {
                "id": row[0],
                "tipo": row[1],
                "numero": row[2]
            },
            "norma_modificada": {
                "id": row[3],
                "tipo": row[4],
                "numero": row[5]
            },
            "fecha_modificacion": row[6].isoformat() if row[6] else None,
            "fecha_derogacion": row[7].isoformat() if row[7] else None
        })
    
    # Normas aisladas (pueden indicar desconexión normativa)  
    query3 = text("""
    SELECT 
        id_norma, 
        tipo, 
        numero, 
        anio, 
        titulo 
    FROM normas
    WHERE id_norma NOT IN (
        SELECT norma_modificadora FROM relaciones_normativas
        UNION
        SELECT norma_modificada FROM relaciones_normativas
    )
    LIMIT 100
    """)
    
    result3 = db.execute(query3)
    for row in result3:
        resultados["normas_aisladas"].append({
            "id_norma": row[0],
            "tipo": row[1],
            "numero": row[2],
            "anio": row[3],
            "titulo": row[4]
        })
    
    return resultados