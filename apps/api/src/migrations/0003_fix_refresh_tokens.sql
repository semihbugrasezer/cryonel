-- Fix refresh_tokens table
-- Add missing is_revoked column

-- Add is_revoked column to refresh_tokens table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'refresh_tokens' AND column_name = 'is_revoked') THEN
        ALTER TABLE refresh_tokens ADD COLUMN is_revoked BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create index for revoked tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked ON refresh_tokens(is_revoked);

-- Add composite index for efficient token lookup
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_status ON refresh_tokens(token_hash, is_revoked, expires_at);
