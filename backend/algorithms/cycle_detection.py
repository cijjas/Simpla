import networkx as nx
from sqlalchemy import text
from sqlalchemy.orm import Session

def detectar_ciclos_sql(db: Session):
    """
    Detecta ciclos en las relaciones normativas usando SQL recursivo
    """
    query = text("""
    WITH RECURSIVE ciclo_normativo AS (
        SELECT 
            norma_modificadora as inicio,
            norma_modificadora, 
            norma_modificada, 
            ARRAY[norma_modificadora] as path,
            1 as nivel
        FROM relaciones_normativas
        
        UNION ALL
        
        SELECT 
            c.inicio,
            r.norma_modificadora, 
            r.norma_modificada,
            c.path || r.norma_modificadora,
            c.nivel + 1
        FROM relaciones_normativas r
        JOIN ciclo_normativo c ON r.norma_modificadora = c.norma_modificada
        WHERE NOT r.norma_modificadora = ANY(c.path)
        AND c.nivel < 10  -- Limitar profundidad de búsqueda
    )
    SELECT 
        inicio, 
        norma_modificada, 
        path || norma_modificada as ciclo_completo
    FROM ciclo_normativo
    WHERE norma_modificada = inicio
    AND nivel > 1
    LIMIT 1000  -- Limitar resultados
    """)
    
    result = db.execute(query)
    ciclos = []
    for row in result:
        ciclos.append({
            "inicio": row[0],
            "fin": row[1],
            "ciclo": row[2]
        })
    
    return ciclos

def detectar_ciclos_networkx(db: Session):
    """
    Detecta ciclos usando el algoritmo de NetworkX (alternativa para conjuntos pequeños)
    """
    # Consultar todas las relaciones
    query = text("SELECT norma_modificadora, norma_modificada FROM relaciones_normativas")
    result = db.execute(query)
    
    # Construir grafo dirigido
    G = nx.DiGraph()
    for row in result:
        G.add_edge(row[0], row[1])
    
    # Detectar ciclos simples
    ciclos = list(nx.simple_cycles(G))
    
    return [{"ciclo": ciclo} for ciclo in ciclos[:1000]]  # Limitar a 1000 ciclos