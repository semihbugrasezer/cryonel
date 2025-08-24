-- CRYONEL Database Schema
-- PostgreSQL 15 with encryption extensions

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    pw_hash TEXT NOT NULL,
    twofa_enabled BOOLEAN DEFAULT FALSE,
    twofa_secret TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    subscription_tier TEXT DEFAULT 'standard' CHECK (subscription_tier IN ('standard', 'pro', 'elite')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'suspended')),
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User API keys (encrypted)
CREATE TABLE IF NOT EXISTS user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exchange TEXT NOT NULL CHECK (exchange IN ('binance', 'bybit', 'kraken', 'bitstamp', 'coinbase')),
    key_enc TEXT NOT NULL,
    secret_enc TEXT NOT NULL,
    passphrase_enc TEXT, -- For some exchanges like Coinbase Pro
    can_withdraw BOOLEAN DEFAULT FALSE, -- Must be false for security
    is_active BOOLEAN DEFAULT TRUE,
    last_used TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solana wallets (encrypted)
CREATE TABLE IF NOT EXISTS user_solana_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_name TEXT NOT NULL,
    private_key_enc TEXT NOT NULL,
    public_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    venue TEXT NOT NULL CHECK (venue IN ('binance', 'bybit', 'kraken', 'bitstamp', 'coinbase', 'raydium', 'jupiter', 'orca')),
    base TEXT NOT NULL,
    quote TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    qty NUMERIC NOT NULL CHECK (qty > 0),
    price NUMERIC NOT NULL CHECK (price > 0),
    fees NUMERIC DEFAULT 0,
    fees_currency TEXT,
    txid TEXT,
    order_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'failed')),
    type TEXT DEFAULT 'market' CHECK (type IN ('market', 'limit')),
    strategy TEXT, -- 'arbitrage', 'copy_trading', 'manual'
    profit_loss NUMERIC,
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
    max_followers INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy trading relationships
CREATE TABLE IF NOT EXISTS copy_trading_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    master_id UUID REFERENCES users(id) ON DELETE CASCADE,
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    risk_multiplier NUMERIC DEFAULT 1.0 CHECK (risk_multiplier > 0 AND risk_multiplier <= 5.0),
    max_position_size NUMERIC,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(master_id, follower_id)
);

-- Copy trading executions
CREATE TABLE IF NOT EXISTS copy_trading_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id UUID REFERENCES copy_trading_relationships(id) ON DELETE CASCADE,
    master_signal_id BIGINT REFERENCES master_signals(id) ON DELETE CASCADE,
    executed_trade_id BIGINT REFERENCES trades(id) ON DELETE CASCADE,
    execution_price NUMERIC NOT NULL,
    execution_qty NUMERIC NOT NULL,
    slippage NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Arbitrage opportunities
CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base TEXT NOT NULL,
    quote TEXT NOT NULL,
    venue_a TEXT NOT NULL,
    venue_b TEXT NOT NULL,
    price_a NUMERIC NOT NULL,
    price_b NUMERIC NOT NULL,
    spread_percentage NUMERIC NOT NULL,
    estimated_profit NUMERIC,
    fees_a NUMERIC DEFAULT 0,
    fees_b NUMERIC DEFAULT 0,
    min_profit_threshold NUMERIC DEFAULT 0.5,
    is_executed BOOLEAN DEFAULT FALSE,
    execution_trade_id BIGINT REFERENCES trades(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes')
);

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh tokens (for JWT rotation)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_tier, subscription_status);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_exchange ON user_api_keys(exchange, is_active);

CREATE INDEX IF NOT EXISTS idx_trades_user_created ON trades(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_venue_created ON trades(venue, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_strategy ON trades(strategy, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(base, quote, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_master_signals_master ON master_signals(master_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_master_signals_symbol ON master_signals(symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_master_signals_active ON master_signals(is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_copy_relationships_master ON copy_trading_relationships(master_id);
CREATE INDEX IF NOT EXISTS idx_copy_relationships_follower ON copy_trading_relationships(follower_id);

CREATE INDEX IF NOT EXISTS idx_arbitrage_opportunities_symbol ON arbitrage_opportunities(base, quote);
CREATE INDEX IF NOT EXISTS idx_arbitrage_opportunities_spread ON arbitrage_opportunities(spread_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_arbitrage_opportunities_expires ON arbitrage_opportunities(expires_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);

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
CREATE TRIGGER update_user_solana_wallets_updated_at BEFORE UPDATE ON user_solana_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_master_signals_updated_at BEFORE UPDATE ON master_signals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_copy_trading_relationships_updated_at BEFORE UPDATE ON copy_trading_relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
('arbitrage', '{"min_spread_percentage": 0.5, "max_position_size_usd": 10000, "enabled_pairs": ["SOL/USD", "ETH/USD", "BTC/USD"]}', 'Arbitrage configuration'),
('copy_trading', '{"max_followers_per_master": 100, "min_risk_multiplier": 0.1, "max_risk_multiplier": 5.0}', 'Copy trading configuration'),
('security', '{"max_login_attempts": 5, "lockout_duration_minutes": 30, "session_timeout_minutes": 15}', 'Security settings'),
('monitoring', '{"metrics_retention_days": 30, "log_retention_days": 90, "alert_thresholds": {"cpu_percent": 85, "memory_percent": 85}}', 'Monitoring configuration')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Create views for common queries
CREATE OR REPLACE VIEW user_trading_summary AS
SELECT 
    u.id,
    u.email,
    u.subscription_tier,
    COUNT(t.id) as total_trades,
    COUNT(CASE WHEN t.status = 'filled' THEN 1 END) as filled_trades,
    SUM(CASE WHEN t.profit_loss IS NOT NULL THEN t.profit_loss ELSE 0 END) as total_pnl,
    AVG(CASE WHEN t.profit_loss IS NOT NULL THEN t.profit_loss ELSE 0 END) as avg_pnl,
    MAX(t.created_at) as last_trade_at
FROM users u
LEFT JOIN trades t ON u.id = t.user_id
GROUP BY u.id, u.email, u.subscription_tier;

CREATE OR REPLACE VIEW arbitrage_summary AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    base,
    quote,
    COUNT(*) as opportunities,
    AVG(spread_percentage) as avg_spread,
    MAX(spread_percentage) as max_spread,
    COUNT(CASE WHEN is_executed THEN 1 END) as executed_count,
    SUM(CASE WHEN is_executed THEN estimated_profit ELSE 0 END) as total_profit
FROM arbitrage_opportunities
GROUP BY DATE_TRUNC('hour', created_at), base, quote
ORDER BY hour DESC, total_profit DESC;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cryonel_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cryonel_user;