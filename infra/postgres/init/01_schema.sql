-- CRYONEL Database Schema
-- Initialize database with required extensions and tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    pw_hash TEXT NOT NULL,
    twofa_enabled BOOLEAN DEFAULT FALSE,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User API keys (encrypted)
CREATE TABLE IF NOT EXISTS user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exchange TEXT NOT NULL,       -- 'binance','bybit','kraken',...
    key_enc TEXT NOT NULL,
    secret_enc TEXT NOT NULL,
    can_withdraw BOOLEAN DEFAULT FALSE, -- must be false for security
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    venue TEXT NOT NULL,           -- 'kraken','raydium','jupiter'
    base TEXT NOT NULL,
    quote TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    qty NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    fees NUMERIC NOT NULL,
    txid TEXT,
    order_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master signals for copy trading
CREATE TABLE IF NOT EXISTS master_signals (
    id BIGSERIAL PRIMARY KEY,
    master_id UUID REFERENCES users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('open', 'close')),
    entry NUMERIC,
    stop NUMERIC,
    take_profit NUMERIC[],
    risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
    meta JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy trading relationships
CREATE TABLE IF NOT EXISTS copy_relationships (
    id BIGSERIAL PRIMARY KEY,
    master_id UUID REFERENCES users(id) ON DELETE CASCADE,
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    risk_multiplier NUMERIC DEFAULT 1.0,
    max_position_size NUMERIC,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(master_id, follower_id)
);

-- Arbitrage opportunities
CREATE TABLE IF NOT EXISTS arb_opportunities (
    id BIGSERIAL PRIMARY KEY,
    pair TEXT NOT NULL,
    venue_a TEXT NOT NULL,
    venue_b TEXT NOT NULL,
    price_a NUMERIC NOT NULL,
    price_b NUMERIC NOT NULL,
    spread_percent NUMERIC NOT NULL,
    estimated_profit NUMERIC,
    status TEXT DEFAULT 'detected' CHECK (status IN ('detected', 'executed', 'expired', 'failed')),
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System metrics
CREATE TABLE IF NOT EXISTS system_metrics (
    id BIGSERIAL PRIMARY KEY,
    service TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    labels JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_exchange ON user_api_keys(exchange);
CREATE INDEX IF NOT EXISTS idx_trades_user_created ON trades(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_venue_created ON trades(venue, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(base, quote);
CREATE INDEX IF NOT EXISTS idx_master_signals_master_created ON master_signals(master_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_master_signals_symbol_created ON master_signals(symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_copy_relationships_follower ON copy_relationships(follower_id);
CREATE INDEX IF NOT EXISTS idx_arb_opportunities_pair_status ON arb_opportunities(pair, status);
CREATE INDEX IF NOT EXISTS idx_system_metrics_service_time ON system_metrics(service, timestamp DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_api_keys_updated_at BEFORE UPDATE ON user_api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_master_signals_updated_at BEFORE UPDATE ON master_signals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_copy_relationships_updated_at BEFORE UPDATE ON copy_relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial admin user (password: admin123 - change in production!)
INSERT INTO users (email, pw_hash, role) 
VALUES ('admin@cryonel.com', crypt('admin123', gen_salt('bf')), 'admin')
ON CONFLICT (email) DO NOTHING;
