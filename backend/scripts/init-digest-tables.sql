-- Migration script for digest feature tables
-- These tables should already exist according to user requirements
-- This script is provided for reference and can be used to verify the schema

-- Table for user digest preferences
CREATE TABLE IF NOT EXISTS public.digest_user_preferences (
  user_id UUID NOT NULL,
  filter_options JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT user_preferences_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Table for weekly digests
CREATE TABLE IF NOT EXISTS public.digest_weekly (
  id UUID NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  article_summary TEXT NULL,
  total_normas INTEGER NULL,
  article_json JSONB NULL,
  CONSTRAINT weekly_digests_pkey PRIMARY KEY (id),
  CONSTRAINT weekly_digests_week_start_week_end_key UNIQUE (week_start, week_end)
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_digest_weekly_week_start 
  ON public.digest_weekly (week_start DESC);

CREATE INDEX IF NOT EXISTS idx_digest_weekly_created_at 
  ON public.digest_weekly (created_at DESC);

-- Comments for documentation
COMMENT ON TABLE public.digest_user_preferences IS 
  'Stores user preferences for filtering weekly digest content';

COMMENT ON TABLE public.digest_weekly IS 
  'Stores generated weekly digest reports';

COMMENT ON COLUMN public.digest_user_preferences.filter_options IS 
  'JSONB object containing filter options: tipo_norma, jurisdiccion, clase_norma arrays';

COMMENT ON COLUMN public.digest_weekly.article_json IS 
  'JSONB object containing full norma summaries and metadata';

