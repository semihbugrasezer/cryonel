-- infra/db/init/01-init.sql
-- CRYONEL Database Initialization Script

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    pw_hash TEXT NOT NULL,
    twofa_enabled BOOLEAN DEFAULT FALSE,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_api_keys table
CREATE TABLE IF NOT EXISTS user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exchange TEXT NOT NULL,
    key_enc TEXT NOT NULL,
    secret_enc TEXT NOT NULL,
    can_withdraw BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    venue TEXT NOT NULL,
    base TEXT NOT NULL,
    quote TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    qty NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    fees NUMERIC NOT NULL,
    txid TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create master_signals table
CREATE TABLE IF NOT EXISTS master_signals (
    id BIGSERIAL PRIMARY KEY,
    master_id UUID REFERENCES users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('open', 'close')),
    entry NUMERIC,
    stop NUMERIC,
    take_profit NUMERIC[],
    meta JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create copy_trading_followers table
CREATE TABLE IF NOT EXISTS copy_trading_followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    master_id UUID REFERENCES users(id) ON DELETE CASCADE,
    risk_level NUMERIC DEFAULT 1.0 CHECK (risk_level > 0 AND risk_level <= 10),
    max_position_size NUMERIC DEFAULT 1000,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, master_id)
);

-- Create arbitrage_jobs table
CREATE TABLE IF NOT EXISTS arbitrage_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pair TEXT NOT NULL,
    venues TEXT[] NOT NULL,
    threshold NUMERIC NOT NULL,
    max_slippage NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    result JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_exchange ON user_api_keys(exchange);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_venue ON trades(venue);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_master_signals_master_id ON master_signals(master_id);
CREATE INDEX IF NOT EXISTS idx_master_signals_symbol ON master_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_master_signals_created_at ON master_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_copy_trading_followers_follower_id ON copy_trading_followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_copy_trading_followers_master_id ON copy_trading_followers(master_id);
CREATE INDEX IF NOT EXISTS idx_arbitrage_jobs_user_id ON arbitrage_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_arbitrage_jobs_status ON arbitrage_jobs(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_api_keys_updated_at BEFORE UPDATE ON user_api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_master_signals_updated_at BEFORE UPDATE ON master_signals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_copy_trading_followers_updated_at BEFORE UPDATE ON copy_trading_followers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_arbitrage_jobs_updated_at BEFORE UPDATE ON arbitrage_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123 - change this in production!)
INSERT INTO users (email, pw_hash, role) 
VALUES ('admin@cryonel.com', crypt('admin123', gen_salt('bf')), 'admin')
ON CONFLICT (email) DO NOTHING;
