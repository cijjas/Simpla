-- Database indexes for normas feature performance optimization
-- Run this script to add necessary indexes for efficient queries

-- Indexes for norma_structured table
CREATE INDEX IF NOT EXISTS idx_norma_structured_infoleg_id ON norma_structured(infoleg_id);
CREATE INDEX IF NOT EXISTS idx_norma_structured_jurisdiccion ON norma_structured(jurisdiccion);
CREATE INDEX IF NOT EXISTS idx_norma_structured_tipo_norma ON norma_structured(tipo_norma);
CREATE INDEX IF NOT EXISTS idx_norma_structured_clase_norma ON norma_structured(clase_norma);
CREATE INDEX IF NOT EXISTS idx_norma_structured_estado ON norma_structured(estado);
CREATE INDEX IF NOT EXISTS idx_norma_structured_sancion ON norma_structured(sancion);
CREATE INDEX IF NOT EXISTS idx_norma_structured_publicacion ON norma_structured(publicacion);
CREATE INDEX IF NOT EXISTS idx_norma_structured_created_at ON norma_structured(created_at);

-- Composite index for common search patterns
CREATE INDEX IF NOT EXISTS idx_norma_structured_search ON norma_structured(jurisdiccion, tipo_norma, estado);

-- Full-text search indexes (if using PostgreSQL full-text search)
CREATE INDEX IF NOT EXISTS idx_norma_structured_texto_resumido_gin ON norma_structured USING gin(to_tsvector('spanish', texto_resumido));
CREATE INDEX IF NOT EXISTS idx_norma_structured_titulo_sumario_gin ON norma_structured USING gin(to_tsvector('spanish', titulo_sumario));
CREATE INDEX IF NOT EXISTS idx_norma_structured_titulo_resumido_gin ON norma_structured USING gin(to_tsvector('spanish', titulo_resumido));

-- Indexes for norma_divisions table
CREATE INDEX IF NOT EXISTS idx_norma_divisions_norma_id ON norma_divisions(norma_id);
CREATE INDEX IF NOT EXISTS idx_norma_divisions_parent_division_id ON norma_divisions(parent_division_id);
CREATE INDEX IF NOT EXISTS idx_norma_divisions_order_index ON norma_divisions(order_index);

-- Composite index for division hierarchy queries
CREATE INDEX IF NOT EXISTS idx_norma_divisions_norma_parent ON norma_divisions(norma_id, parent_division_id);

-- Indexes for norma_articles table
CREATE INDEX IF NOT EXISTS idx_norma_articles_division_id ON norma_articles(division_id);
CREATE INDEX IF NOT EXISTS idx_norma_articles_parent_article_id ON norma_articles(parent_article_id);
CREATE INDEX IF NOT EXISTS idx_norma_articles_order_index ON norma_articles(order_index);

-- Composite index for article hierarchy queries
CREATE INDEX IF NOT EXISTS idx_norma_articles_division_parent ON norma_articles(division_id, parent_article_id);

-- Statistics update to help query planner
ANALYZE norma_structured;
ANALYZE norma_divisions;
ANALYZE norma_articles;
