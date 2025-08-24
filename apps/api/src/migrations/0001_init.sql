-- Initial CRYONEL database setup
-- This migration creates the basic table structure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    pw_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    twofa_enabled BOOLEAN DEFAULT false,
    twofa_secret TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User API keys (encrypted exchange credentials)
CREATE TABLE IF NOT EXISTS user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exchange TEXT NOT NULL,
    key_enc TEXT NOT NULL,
    secret_enc TEXT NOT NULL,
    can_withdraw BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT user_exchange_unique UNIQUE (user_id, exchange)
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    venue TEXT NOT NULL,
    base TEXT NOT NULL,
    quote TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    type TEXT DEFAULT 'market' CHECK (type IN ('market', 'limit')),
    qty NUMERIC NOT NULL CHECK (qty > 0),
    price NUMERIC NOT NULL CHECK (price > 0),
    fees NUMERIC NOT NULL DEFAULT 0,
    txid TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master trading signals
CREATE TABLE IF NOT EXISTS master_signals (
    id BIGSERIAL PRIMARY KEY,
    master_id UUID REFERENCES users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('open', 'close')),
    entry NUMERIC,
    stop NUMERIC,
    take_profit NUMERIC[],
    meta JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'executed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master followers table
CREATE TABLE IF NOT EXISTS master_followers (
    id BIGSERIAL PRIMARY KEY,
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    master_id UUID REFERENCES users(id) ON DELETE CASCADE,
    risk_percentage NUMERIC NOT NULL CHECK (risk_percentage > 0 AND risk_percentage <= 100),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_follower_master UNIQUE (follower_id, master_id)
);

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_created ON trades(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_master_signals_master_created ON master_signals(master_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_master_followers_follower_id ON master_followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_master_followers_master_id ON master_followers(master_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_api_keys_updated_at 
    BEFORE UPDATE ON user_api_keys 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER master_followers_updated_at 
    BEFORE UPDATE ON master_followers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at();