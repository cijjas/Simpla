-- 2. Lookup tables -----------------------------------------------------------
CREATE TABLE tipos_norma (
    id      serial PRIMARY KEY,
    nombre  varchar(255) NOT NULL UNIQUE
);

CREATE TABLE clases_norma (
    id      serial PRIMARY KEY,
    nombre  varchar(255) NOT NULL UNIQUE
);

CREATE TABLE organismos (
    id      serial PRIMARY KEY,
    nombre  varchar(255) NOT NULL UNIQUE
);

-- 3. Main entity -------------------------------------------------------------
CREATE TABLE normas (
    id_norma              bigint        PRIMARY KEY,
    tipo_norma_id         int           NOT NULL
                                 REFERENCES tipos_norma(id),
    numero_norma          varchar(50),
    clase_norma_id        int           REFERENCES clases_norma(id),
    organismo_id          int           REFERENCES organismos(id),
    fecha_sancion         date,
    numero_boletin        int,
    fecha_boletin         date,
    pagina_boletin        int,
    titulo_resumido       text,
    titulo_sumario        text,
    texto_resumido        text,
    observaciones         text,
    texto_original        text,
    texto_actualizado     text,
    modificada_por_count  int           DEFAULT 0 CHECK (modificada_por_count >= 0),
    modifica_a_count      int           DEFAULT 0 CHECK (modifica_a_count  >= 0),
    created_at            timestamptz   DEFAULT now(),
    updated_at            timestamptz   DEFAULT now()
);

-- 4. Many‑to‑many relationships ---------------------------------------------
CREATE TABLE relaciones_normativas (
    norma_modificadora bigint NOT NULL
                        REFERENCES normas(id_norma) ON DELETE CASCADE,
    norma_modificada   bigint NOT NULL
                        REFERENCES normas(id_norma) ON DELETE CASCADE,
    tipo_relacion      varchar(20) NOT NULL,
    PRIMARY KEY (norma_modificadora, norma_modificada, tipo_relacion)
);

-- 5. Indexes beyond PK/FK -----------------------------------------------------
-- Look‑ups
CREATE INDEX idx_normas_tipo_norma      ON normas(tipo_norma_id);
CREATE INDEX idx_normas_clase_norma     ON normas(clase_norma_id);
CREATE INDEX idx_normas_organismo       ON normas(organismo_id);

-- Common filter / sort columns
CREATE INDEX idx_normas_fecha_sancion   ON normas(fecha_sancion);
CREATE INDEX idx_normas_numero_norma    ON normas(numero_norma);
CREATE INDEX idx_normas_numero_boletin  ON normas(numero_boletin);

-- Relations – quickly find “who modifies this” and “what does this modify”
CREATE INDEX idx_rel_by_modificada      ON relaciones_normativas(norma_modificada);
CREATE INDEX idx_rel_by_modificadora    ON relaciones_normativas(norma_modificadora);

-- 6. Trigger to keep updated_at current --------------------------------------
CREATE OR REPLACE FUNCTION trg_set_timestamp()
RETURNS trigger LANGUAGE plpgsql AS
$$BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;$$;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON normas
FOR EACH ROW
EXECUTE FUNCTION trg_set_timestamp();
