CREATE TABLE normas (
    id_norma VARCHAR PRIMARY KEY,
    tipo_norma VARCHAR,
    numero_norma VARCHAR,
    clase_norma VARCHAR,
    organismo_origen VARCHAR,
    fecha_sancion DATE,
    numero_boletin VARCHAR,
    fecha_boletin DATE,
    pagina_boletin VARCHAR,
    titulo_resumido TEXT,
    titulo_sumario TEXT,
    texto_resumido TEXT,
    observaciones TEXT,
    texto_original TEXT,
    texto_actualizado TEXT,
    modificada_por TEXT,
    modifica_a TEXT
);

-- Tabla para relaciones extraídas de los campos modificada_por y modifica_a
CREATE TABLE relaciones_normativas (
    id SERIAL PRIMARY KEY,
    norma_modificadora VARCHAR REFERENCES normas(id_norma),
    norma_modificada VARCHAR REFERENCES normas(id_norma),
    tipo_relacion VARCHAR DEFAULT 'modifica',
    UNIQUE(norma_modificadora, norma_modificada, tipo_relacion)
);

-- Índices para optimizar consultas
CREATE INDEX idx_norma_modificadora ON relaciones_normativas(norma_modificadora);
CREATE INDEX idx_norma_modificada ON relaciones_normativas(norma_modificada);