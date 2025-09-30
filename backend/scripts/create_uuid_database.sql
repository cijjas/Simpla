-- Database schema with UUID primary keys
-- This script creates all necessary tables with UUID primary keys

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table with UUID primary key
CREATE TABLE public.users (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255),
    name VARCHAR(255),
    provider VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMP WITH TIME ZONE,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_unique UNIQUE (email)
);

-- Create refresh_tokens table with UUID primary key
CREATE TABLE public.refresh_tokens (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    token VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id),
    CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create folders table with UUID primary key
CREATE TABLE public.folders (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_folder_id UUID,
    level INTEGER NOT NULL DEFAULT 0 CHECK (level >= 0 AND level <= 100),
    color VARCHAR(7),
    icon VARCHAR(50) DEFAULT 'folder',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT folders_pkey PRIMARY KEY (id),
    CONSTRAINT folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT folders_parent_folder_id_fkey FOREIGN KEY (parent_folder_id) REFERENCES public.folders(id) ON DELETE CASCADE,
    CONSTRAINT folders_no_self_reference CHECK (id != parent_folder_id)
);

-- Create folder_normas table with UUID primary key
-- Note: Foreign key to normas_structured is commented out until that table is created
CREATE TABLE public.folder_normas (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    folder_id UUID NOT NULL,
    norma_id INTEGER NOT NULL,
    added_by UUID NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    order_index INTEGER DEFAULT 0,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT folder_normas_pkey PRIMARY KEY (id),
    CONSTRAINT folder_normas_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE CASCADE,
    -- CONSTRAINT folder_normas_norma_id_fkey FOREIGN KEY (norma_id) REFERENCES public.normas_structured(id) ON DELETE CASCADE,
    CONSTRAINT folder_normas_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create chat_sessions table with UUID primary key
CREATE TABLE public.chat_sessions (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT,
    system_prompt TEXT,
    total_tokens INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chat_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create messages table with UUID primary key
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    role TEXT CHECK (role IN ('system', 'user', 'assistant')),
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    cost_usd NUMERIC(10,4) DEFAULT 0.0,
    message_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT messages_pkey PRIMARY KEY (id),
    CONSTRAINT messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON public.refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON public.refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_revoked ON public.refresh_tokens(revoked);
CREATE INDEX idx_refresh_tokens_active ON public.refresh_tokens(user_id, expires_at) WHERE revoked = FALSE;

CREATE INDEX idx_folders_user_id ON public.folders(user_id);
CREATE INDEX idx_folders_parent_folder_id ON public.folders(parent_folder_id);
CREATE INDEX idx_folders_level ON public.folders(level);
CREATE INDEX idx_folders_order_index ON public.folders(user_id, parent_folder_id, order_index);
CREATE INDEX idx_folders_is_deleted ON public.folders(is_deleted);
CREATE INDEX idx_folders_updated_at ON public.folders(updated_at);

CREATE INDEX idx_folder_normas_folder_id ON public.folder_normas(folder_id);
CREATE INDEX idx_folder_normas_norma_id ON public.folder_normas(norma_id);
CREATE INDEX idx_folder_normas_added_by ON public.folder_normas(added_by);
CREATE INDEX idx_folder_normas_order_index ON public.folder_normas(folder_id, order_index);
CREATE INDEX idx_folder_normas_is_deleted ON public.folder_normas(is_deleted);
CREATE INDEX idx_folder_normas_updated_at ON public.folder_normas(updated_at);

CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_created_at ON public.chat_sessions(created_at);
CREATE INDEX idx_chat_sessions_updated_at ON public.chat_sessions(updated_at);
CREATE INDEX idx_chat_sessions_is_deleted ON public.chat_sessions(is_deleted);

CREATE INDEX idx_messages_session_id ON public.messages(session_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_messages_updated_at ON public.messages(updated_at);
CREATE INDEX idx_messages_role ON public.messages(role);
CREATE INDEX idx_messages_is_deleted ON public.messages(is_deleted);

-- Add unique constraints where appropriate
CREATE UNIQUE INDEX idx_refresh_tokens_active_token ON public.refresh_tokens(token) WHERE revoked = FALSE;

-- Unique constraint for folder names per parent (only for non-deleted folders)
CREATE UNIQUE INDEX idx_folders_unique_name_per_parent ON public.folders(user_id, parent_folder_id, name) WHERE is_deleted = FALSE;

-- Unique constraint for folder-norma pairs (only for non-deleted entries)
CREATE UNIQUE INDEX idx_folder_normas_unique_folder_norma ON public.folder_normas(folder_id, norma_id) WHERE is_deleted = FALSE;

-- Function to prevent circular references in folder hierarchy
CREATE OR REPLACE FUNCTION check_folder_circular_reference()
RETURNS TRIGGER AS $$
DECLARE
    current_parent UUID;
    depth INTEGER := 0;
BEGIN
    -- If no parent, no circular reference possible
    IF NEW.parent_folder_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Check if parent is the same as the folder being updated
    IF NEW.id = NEW.parent_folder_id THEN
        RAISE EXCEPTION 'Folder cannot be its own parent';
    END IF;
    
    -- Traverse up the hierarchy to check for circular reference
    current_parent := NEW.parent_folder_id;
    depth := 1;
    
    WHILE current_parent IS NOT NULL AND depth <= 100 LOOP
        -- If we find the current folder in the parent chain, it's circular
        IF current_parent = NEW.id THEN
            RAISE EXCEPTION 'Circular reference detected in folder hierarchy';
        END IF;
        
        -- Get the parent of the current parent
        SELECT parent_folder_id INTO current_parent 
        FROM folders 
        WHERE id = current_parent AND is_deleted = FALSE;
        
        depth := depth + 1;
    END LOOP;
    
    -- If we hit the depth limit, something is wrong
    IF depth > 100 THEN
        RAISE EXCEPTION 'Folder hierarchy exceeds maximum depth of 100 levels';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent circular references
CREATE TRIGGER prevent_folder_circular_reference
    BEFORE INSERT OR UPDATE ON public.folders
    FOR EACH ROW
    EXECUTE FUNCTION check_folder_circular_reference();

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at
    BEFORE UPDATE ON public.folders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folder_normas_updated_at
    BEFORE UPDATE ON public.folder_normas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Function to clean up expired refresh tokens
-- Run this periodically via a cron job or scheduled task
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM refresh_tokens 
    WHERE expires_at < NOW() - INTERVAL '30 days'
    RETURNING count(*) INTO deleted_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- TODO: When normas_structured table is created, add the foreign key constraint:
-- ALTER TABLE public.folder_normas 
-- ADD CONSTRAINT folder_normas_norma_id_fkey 
-- FOREIGN KEY (norma_id) REFERENCES public.normas_structured(id) ON DELETE CASCADE;