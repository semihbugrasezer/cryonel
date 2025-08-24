-- CRYONEL Database Schema
-- This file contains the SQL schema for all database tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  pw_hash VARCHAR(255),
  name VARCHAR(255),
  avatar_url TEXT,
  google_id VARCHAR(255),
  github_id VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'active',
  twofa_enabled BOOLEAN DEFAULT false,
  twofa_secret VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refresh Tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exchange VARCHAR(50) NOT NULL,
  key_enc TEXT NOT NULL,
  secret_enc TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exchange)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exchange VARCHAR(50) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
  type VARCHAR(10) NOT NULL CHECK (type IN ('market', 'limit')),
  quantity DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'rejected')),
  exchange_order_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Master Signals table
CREATE TABLE IF NOT EXISTS master_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exchange VARCHAR(50) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
  entry_price DECIMAL(20, 8) NOT NULL,
  stop_loss DECIMAL(20, 8) NOT NULL,
  take_profit DECIMAL(20, 8) NOT NULL,
  risk_percentage DECIMAL(5, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Master Followers table
CREATE TABLE IF NOT EXISTS master_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  master_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  risk_percentage DECIMAL(5, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, master_id)
);

-- User Subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id VARCHAR(100) NOT NULL,
  plan_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Arbitrage Opportunities table
CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_a VARCHAR(50) NOT NULL,
  exchange_b VARCHAR(50) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  price_a DECIMAL(20, 8) NOT NULL,
  price_b DECIMAL(20, 8) NOT NULL,
  spread_percentage DECIMAL(10, 4) NOT NULL,
  estimated_profit DECIMAL(20, 8),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'executed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE
);

-- Copy Trading Executions table
CREATE TABLE IF NOT EXISTS copy_trading_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_signal_id UUID NOT NULL REFERENCES master_signals(id) ON DELETE CASCADE,
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exchange VARCHAR(50) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8),
  status VARCHAR(20) DEFAULT 'pending',
  exchange_order_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_exchange ON api_keys(user_id, exchange);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_exchange_symbol ON orders(exchange, symbol);
CREATE INDEX IF NOT EXISTS idx_master_signals_user_status ON master_signals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_master_followers_follower ON master_followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_master_followers_master ON master_followers(master_id);
CREATE INDEX IF NOT EXISTS idx_arbitrage_opportunities_symbol_status ON arbitrage_opportunities(symbol, status);
CREATE INDEX IF NOT EXISTS idx_copy_trading_executions_signal ON copy_trading_executions(master_signal_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- DCE Plans table for Deterministic Copy Execution
CREATE TABLE IF NOT EXISTS dce_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('time', 'price', 'signal', 'portfolio')),
  trigger_params JSONB NOT NULL,
  actions JSONB NOT NULL,
  constraints JSONB NOT NULL,
  deterministic_hash VARCHAR(64) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
  execution_count INTEGER DEFAULT 0,
  total_pnl DECIMAL(20, 8) DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DCE Executions table for tracking all plan executions
CREATE TABLE IF NOT EXISTS dce_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES dce_plans(id) ON DELETE CASCADE,
  trigger_data JSONB NOT NULL,
  execution_hash VARCHAR(64) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'failed')),
  orders_data JSONB,
  actual_pnl DECIMAL(20, 8),
  execution_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Verifiable PnL snapshots with Merkle tree structure
CREATE TABLE IF NOT EXISTS pnl_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_type VARCHAR(50) NOT NULL CHECK (snapshot_type IN ('daily', 'weekly', 'monthly', 'execution')),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_pnl DECIMAL(20, 8) NOT NULL,
  realized_pnl DECIMAL(20, 8) NOT NULL,
  unrealized_pnl DECIMAL(20, 8) NOT NULL,
  trade_count INTEGER NOT NULL,
  positions_data JSONB NOT NULL,
  merkle_root VARCHAR(64) NOT NULL,
  merkle_proof JSONB NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategy sharing with verification badges
CREATE TABLE IF NOT EXISTS shared_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES dce_plans(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  tags TEXT[],
  price DECIMAL(10, 2) DEFAULT 0,
  verification_badges TEXT[] DEFAULT '{}',
  performance_data JSONB NOT NULL,
  risk_metrics JSONB NOT NULL,
  subscriber_count INTEGER DEFAULT 0,
  avg_rating DECIMAL(3, 2) DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategy subscriptions
CREATE TABLE IF NOT EXISTS strategy_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES shared_strategies(id) ON DELETE CASCADE,
  allocation_percentage DECIMAL(5, 2) NOT NULL,
  risk_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
  total_pnl DECIMAL(20, 8) DEFAULT 0,
  subscription_fee_paid DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subscriber_id, strategy_id)
);

-- Connection health monitoring
CREATE TABLE IF NOT EXISTS connection_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exchange VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'degraded', 'critical', 'offline')),
  latency_ms INTEGER,
  success_rate DECIMAL(5, 2),
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  websocket_connected BOOLEAN DEFAULT false,
  rate_limit_remaining INTEGER,
  rate_limit_reset TIMESTAMP WITH TIME ZONE,
  last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for DCE tables
CREATE INDEX IF NOT EXISTS idx_dce_plans_user_status ON dce_plans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_dce_plans_trigger_type ON dce_plans(trigger_type);
CREATE INDEX IF NOT EXISTS idx_dce_executions_plan_id ON dce_executions(plan_id);
CREATE INDEX IF NOT EXISTS idx_dce_executions_status ON dce_executions(status);
CREATE INDEX IF NOT EXISTS idx_pnl_snapshots_user_period ON pnl_snapshots(user_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_pnl_snapshots_merkle_root ON pnl_snapshots(merkle_root);
CREATE INDEX IF NOT EXISTS idx_shared_strategies_owner ON shared_strategies(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_strategies_public ON shared_strategies(is_public);
CREATE INDEX IF NOT EXISTS idx_strategy_subscriptions_subscriber ON strategy_subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_connection_health_user_exchange ON connection_health(user_id, exchange);

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_master_signals_updated_at BEFORE UPDATE ON master_signals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_master_followers_updated_at BEFORE UPDATE ON master_followers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_copy_trading_executions_updated_at BEFORE UPDATE ON copy_trading_executions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dce_plans_updated_at BEFORE UPDATE ON dce_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shared_strategies_updated_at BEFORE UPDATE ON shared_strategies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategy_subscriptions_updated_at BEFORE UPDATE ON strategy_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
