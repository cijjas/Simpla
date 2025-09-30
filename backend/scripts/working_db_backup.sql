-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.articles (
  id integer NOT NULL DEFAULT nextval('articles_id_seq'::regclass),
  division_id integer,
  parent_article_id integer,
  ordinal character varying,
  body text NOT NULL,
  order_index integer,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT articles_pkey PRIMARY KEY (id),
  CONSTRAINT articles_division_id_fkey FOREIGN KEY (division_id) REFERENCES public.divisions(id),
  CONSTRAINT articles_parent_article_id_fkey FOREIGN KEY (parent_article_id) REFERENCES public.articles(id)
);
CREATE TABLE public.chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id character varying NOT NULL,
  title text,
  system_prompt text,
  total_tokens integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.divisions (
  id integer NOT NULL DEFAULT nextval('divisions_id_seq'::regclass),
  norma_id integer NOT NULL,
  parent_division_id integer,
  name character varying,
  ordinal character varying,
  title text,
  body text,
  order_index integer,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT divisions_pkey PRIMARY KEY (id),
  CONSTRAINT divisions_norma_id_fkey FOREIGN KEY (norma_id) REFERENCES public.normas_structured(id),
  CONSTRAINT divisions_parent_division_id_fkey FOREIGN KEY (parent_division_id) REFERENCES public.divisions(id)
);
CREATE TABLE public.folder_normas (
  id character varying NOT NULL,
  folder_id character varying NOT NULL,
  norma_id integer NOT NULL,
  added_by character varying NOT NULL,
  added_at timestamp without time zone DEFAULT now(),
  order_index integer DEFAULT 0,
  notes text,
  CONSTRAINT folder_normas_pkey PRIMARY KEY (id),
  CONSTRAINT folder_normas_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id),
  CONSTRAINT folder_normas_norma_id_fkey FOREIGN KEY (norma_id) REFERENCES public.normas_structured(id),
  CONSTRAINT folder_normas_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.users(id)
);
CREATE TABLE public.folders (
  id character varying NOT NULL,
  user_id character varying NOT NULL,
  name character varying NOT NULL,
  description text,
  parent_folder_id character varying,
  level integer NOT NULL DEFAULT 0 CHECK (level >= 0 AND level <= 2),
  color character varying DEFAULT '#3B82F6'::character varying,
  icon character varying DEFAULT 'folder'::character varying,
  order_index integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT folders_pkey PRIMARY KEY (id),
  CONSTRAINT folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT folders_parent_folder_id_fkey FOREIGN KEY (parent_folder_id) REFERENCES public.folders(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  role text CHECK (role = ANY (ARRAY['system'::text, 'user'::text, 'assistant'::text])),
  content text NOT NULL,
  tokens_used integer DEFAULT 0,
  cost_usd numeric DEFAULT 0.0,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id)
);
CREATE TABLE public.normas_structured (
  id integer NOT NULL DEFAULT nextval('normas_structured_id_seq'::regclass),
  infoleg_id integer NOT NULL,
  jurisdiccion character varying,
  clase_norma character varying,
  tipo_norma character varying,
  sancion date,
  id_normas jsonb,
  publicacion date,
  titulo_sumario text,
  titulo_resumido text,
  observaciones text,
  nro_boletin character varying,
  pag_boletin character varying,
  texto_resumido text,
  texto_norma text,
  texto_norma_actualizado text,
  estado character varying,
  lista_normas_que_complementa jsonb,
  lista_normas_que_la_complementan jsonb,
  purified_texto_norma text,
  purified_texto_norma_actualizado text,
  embedding_model character varying,
  embedding_source character varying,
  embedded_at timestamp without time zone,
  embedding_type character varying,
  llm_model_used character varying,
  llm_models_used jsonb,
  llm_tokens_used integer,
  llm_processing_time double precision,
  llm_similarity_score double precision,
  inserted_at timestamp without time zone DEFAULT now(),
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT normas_structured_pkey PRIMARY KEY (id)
);
CREATE TABLE public.refresh_tokens (
  id character varying NOT NULL,
  user_id character varying NOT NULL,
  token text NOT NULL,
  created_at timestamp without time zone,
  revoked boolean,
  CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id character varying NOT NULL,
  email character varying NOT NULL,
  hashed_password character varying,
  name character varying,
  provider character varying,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  email_verified boolean,
  verification_token character varying,
  verification_token_expires timestamp without time zone,
  reset_token character varying,
  reset_token_expires timestamp without time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);