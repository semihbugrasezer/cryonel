-- CRYONEL Database Schema
-- PostgreSQL 15 with pgcrypto extension

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    twofa_enabled BOOLEAN DEFAULT FALSE,
    twofa_secret TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    subscription_tier TEXT DEFAULT 'standard' CHECK (subscription_tier IN ('standard', 'pro')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User API keys (encrypted)
CREATE TABLE IF NOT EXISTS user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exchange TEXT NOT NULL CHECK (exchange IN ('binance', 'bybit', 'kraken', 'bitstamp', 'coinbase')),
    api_key_enc TEXT NOT NULL,
    api_secret_enc TEXT NOT NULL,
    passphrase_enc TEXT, -- For some exchanges like Coinbase Pro
    permissions TEXT[] DEFAULT ARRAY['read', 'trade'],
    can_withdraw BOOLEAN DEFAULT FALSE, -- Must be false for security
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solana wallets (encrypted private keys)
CREATE TABLE IF NOT EXISTS user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    network TEXT DEFAULT 'solana' CHECK (network IN ('solana', 'ethereum', 'bsc')),
    wallet_address TEXT NOT NULL,
    private_key_enc TEXT NOT NULL,
    label TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trading pairs configuration
CREATE TABLE IF NOT EXISTS trading_pairs (
    id SERIAL PRIMARY KEY,
    base_asset TEXT NOT NULL,
    quote_asset TEXT NOT NULL,
    symbol TEXT NOT NULL UNIQUE,
    min_spread_percent DECIMAL(5,4) DEFAULT 0.005,
    max_slippage_percent DECIMAL(5,4) DEFAULT 0.003,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    strategy TEXT NOT NULL CHECK (strategy IN ('arbitrage', 'copy_trading', 'manual')),
    venue TEXT NOT NULL,
    base_asset TEXT NOT NULL,
    quote_asset TEXT NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    order_type TEXT DEFAULT 'market' CHECK (order_type IN ('market', 'limit')),
    quantity DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    fees DECIMAL(20,8) DEFAULT 0,
    fees_asset TEXT,
    total_value DECIMAL(20,8) NOT NULL,
    exchange_order_id TEXT,
    blockchain_txid TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'failed')),
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Arbitrage opportunities
CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
    id BIGSERIAL PRIMARY KEY,
    base_asset TEXT NOT NULL,
    quote_asset TEXT NOT NULL,
    symbol TEXT NOT NULL,
    venue_a TEXT NOT NULL,
    venue_b TEXT NOT NULL,
    price_a DECIMAL(20,8) NOT NULL,
    price_b DECIMAL(20,8) NOT NULL,
    spread_percent DECIMAL(8,4) NOT NULL,
    estimated_profit DECIMAL(20,8),
    fees_a DECIMAL(20,8) DEFAULT 0,
    fees_b DECIMAL(20,8) DEFAULT 0,
    slippage_a DECIMAL(8,4) DEFAULT 0,
    slippage_b DECIMAL(8,4) DEFAULT 0,
    net_profit_percent DECIMAL(8,4),
    is_executable BOOLEAN DEFAULT FALSE,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy trading master signals
CREATE TABLE IF NOT EXISTS master_signals (
    id BIGSERIAL PRIMARY KEY,
    master_id UUID REFERENCES users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('open', 'close', 'modify')),
    entry_price DECIMAL(20,8),
    stop_loss DECIMAL(20,8),
    take_profit DECIMAL(20,8)[],
    quantity DECIMAL(20,8),
    risk_percent DECIMAL(5,2) DEFAULT 2.0,
    meta JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy trading followers
CREATE TABLE IF NOT EXISTS copy_trading_followers (
    id BIGSERIAL PRIMARY KEY,
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    master_id UUID REFERENCES users(id) ON DELETE CASCADE,
    master_signal_id BIGINT REFERENCES master_signals(id) ON DELETE CASCADE,
    risk_multiplier DECIMAL(5,2) DEFAULT 1.0,
    max_risk_percent DECIMAL(5,2) DEFAULT 5.0,
    max_drawdown_percent DECIMAL(5,2) DEFAULT 15.0,
    is_active BOOLEAN DEFAULT TRUE,
    followed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Worker jobs and status
CREATE TABLE IF NOT EXISTS worker_jobs (
    id BIGSERIAL PRIMARY KEY,
    worker_type TEXT NOT NULL CHECK (worker_type IN ('arbitrage', 'copy_master', 'copy_follower')),
    job_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    payload JSONB NOT NULL,
    result JSONB,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System metrics and health checks
CREATE TABLE IF NOT EXISTS system_metrics (
    id BIGSERIAL PRIMARY KEY,
    service_name TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(20,8),
    metric_unit TEXT,
    tags JSONB DEFAULT '{}',
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for security
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_exchange ON user_api_keys(user_id, exchange);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_network ON user_wallets(user_id, network);
CREATE INDEX IF NOT EXISTS idx_trades_user_created ON trades(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_symbol_created ON trades(symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_strategy_created ON trades(strategy, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_arb_opps_symbol_created ON arbitrage_opportunities(symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_arb_opps_spread_created ON arbitrage_opportunities(spread_percent DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_master_signals_master_created ON master_signals(master_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_master_signals_symbol_status ON master_signals(symbol, status);
CREATE INDEX IF NOT EXISTS idx_copy_followers_follower_master ON copy_trading_followers(follower_id, master_id);
CREATE INDEX IF NOT EXISTS idx_worker_jobs_type_status ON worker_jobs(worker_type, status);
CREATE INDEX IF NOT EXISTS idx_worker_jobs_created ON worker_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_service_time ON system_metrics(service_name, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_action ON audit_log(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

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
CREATE TRIGGER update_user_wallets_updated_at BEFORE UPDATE ON user_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_master_signals_updated_at BEFORE UPDATE ON master_signals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default trading pairs
INSERT INTO trading_pairs (base_asset, quote_asset, symbol, min_spread_percent, max_slippage_percent) VALUES
('SOL', 'USDT', 'SOL/USDT', 0.005, 0.003),
('SOL', 'USD', 'SOL/USD', 0.005, 0.003),
('ETH', 'USDT', 'ETH/USDT', 0.004, 0.002),
('BTC', 'USDT', 'BTC/USDT', 0.003, 0.002),
('MATIC', 'USDT', 'MATIC/USDT', 0.006, 0.004),
('AVAX', 'USDT', 'AVAX/USDT', 0.006, 0.004)
ON CONFLICT (symbol) DO NOTHING;

-- Create admin user (password: admin123 - change in production!)
INSERT INTO users (email, password_hash, role, subscription_tier) VALUES
('admin@cryonel.com', crypt('admin123', gen_salt('bf')), 'admin', 'pro')
ON CONFLICT (email) DO NOTHING;
