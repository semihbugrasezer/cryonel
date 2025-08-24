// User and Authentication Types
export interface User {
    id: string;
    email: string;
    username?: string;
    twofa_enabled: boolean;
    created_at: string;
    updated_at: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    username?: string;
    confirmPassword?: string;
}

// CEX API Key Types
export interface CEXApiKey {
    id: string;
    exchange: string;
    key_enc: string;
    secret_enc: string;
    can_withdraw: boolean;
    permissions: string[];
    created_at: string;
    last_used?: string;
    name?: string;
    apiKey?: string;
    secretKey?: string;
    passphrase?: string;
    sandbox?: boolean;
    status?: 'connected' | 'error' | 'success';
    lastTested?: string;
}

export interface CEXConnection {
    exchange: string;
    status: 'connected' | 'disconnected' | 'error';
    latency: number;
    last_check: string;
    error_message?: string;
}

// Wallet Types
export interface Wallet {
    id: string;
    address: string;
    network: string;
    type: 'metamask' | 'phantom' | 'rabby';
    connected: boolean;
    balance?: number;
    last_sync?: string;
}

// Trading Types
export interface Trade {
    id: string;
    exchange: string;
    market: string;
    side: 'buy' | 'sell';
    size: number;
    entry_price: number;
    current_price: number;
    pnl: number;
    pnl_percentage: number;
    spread: number;
    status: 'open' | 'closed' | 'cancelled';
    fees: number;
    created_at: string;
    closed_at?: string;
    txid?: string;
}

export interface Position {
    id: string;
    market: string;
    side: 'long' | 'short';
    size: number;
    entry_price: number;
    mark_price: number;
    unrealized_pnl: number;
    unrealized_pnl_percentage: number;
    liquidation_price?: number;
    created_at: string;
}

// Strategy Types
export interface Strategy {
    id: string;
    name: string;
    description: string;
    type: 'arbitrage' | 'copy' | 'custom' | 'grid' | 'dca' | 'momentum' | 'mean_reversion';
    status: 'active' | 'paused' | 'stopped' | 'running';
    symbols?: string[];
    riskLevel?: number;
    maxPositionSize?: number;
    stopLoss?: number;
    takeProfit?: number;
    enabled?: boolean;
    metrics: {
        sharpe_ratio: number;
        max_drawdown: number;
        win_rate: number;
        total_trades: number;
        profit_factor: number;
    };
    fees: {
        setup: number;
        monthly: number;
        performance: number;
    };
    risk_limits: {
        max_position_size: number;
        max_drawdown: number;
        stop_loss: number;
    };
    created_at: string;
    updated_at: string;
}

// Signal Types
export interface Signal {
    id: string;
    strategy_id: string;
    type: 'buy' | 'sell' | 'close';
    market: string;
    confidence: number;
    payload: {
        entry_price?: number;
        stop_loss?: number;
        take_profit?: number[];
        size?: number;
    };
    created_at: string;
    expires_at?: string;
}

// Copy Trading Types
export interface Master {
    id: string;
    user_id: string;
    username: string;
    strategy_id: string;
    followers_count: number;
    total_aum: number;
    performance: {
        total_return: number;
        monthly_return: number;
        max_drawdown: number;
        sharpe_ratio: number;
    };
    fees: {
        setup: number;
        monthly: number;
        performance: number;
    };
    created_at: string;
}

export interface Follower {
    id: string;
    user_id: string;
    master_id: string;
    allocation_percentage: number;
    max_position_size: number;
    slippage_tolerance: number;
    auto_follow: boolean;
    created_at: string;
}

// Health and Monitoring Types
export interface ConnectionHealth {
    latency: number;
    uptime: number;
    errorRate: number;
    status: 'connected' | 'connecting' | 'disconnected';
    cex_latency?: number;
    rpc_latency?: number;
    websocket_status?: 'connected' | 'connecting' | 'disconnected';
    throttled?: boolean;
    limits?: {
        rate_limit: number;
        remaining: number;
        reset_time: string;
    };
    last_check?: string;
}

// Alert Types
export interface Alert {
    id: string;
    type: 'price' | 'spread' | 'pnl' | 'latency';
    condition: 'above' | 'below' | 'equals';
    value: number;
    market?: string;
    enabled: boolean;
    channels: ('email' | 'telegram' | 'webhook')[];
    created_at: string;
    last_triggered?: string;
}

// AI Types
export interface AIRequest {
    type: 'ideas' | 'explain' | 'alerts';
    payload: Record<string, any>;
    model?: string;
    max_tokens?: number;
}

export interface AIResponse {
    success: boolean;
    data?: any;
    error?: string;
    confidence?: number;
    risk_flags?: string[];
    cached: boolean;
}

// UI State Types
export interface UIState {
    theme: 'light' | 'dark';
    sidebar_open: boolean;
    sidebar_collapsed: boolean;
    active_modals: string[];
    notifications: Notification[];
}

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
    created_at: string;
}

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
    };
}

export interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}

// Form Types
export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox';
    required: boolean;
    validation?: any;
    options?: { value: string; label: string }[];
    placeholder?: string;
    help_text?: string;
}

// Risk Management Types
export interface RiskLimits {
    max_position_size: number;
    max_daily_loss: number;
    max_drawdown: number;
    stop_loss_percentage: number;
    take_profit_percentage: number;
    max_leverage: number;
    kill_switch_enabled: boolean;
}

// Performance Metrics
export interface PerformanceMetrics {
    total_return: number;
    daily_return: number;
    weekly_return: number;
    monthly_return: number;
    yearly_return: number;
    sharpe_ratio: number;
    max_drawdown: number;
    win_rate: number;
    profit_factor: number;
    average_trade: number;
    total_trades: number;
    profitable_trades: number;
    losing_trades: number;
}

// Chart Types
export interface PnLDataPoint {
    timestamp: string;
    pnl: number;
    cumulative: number;
    date?: string;
    time?: string;
    displayValue?: number;
}

export interface EquityDataPoint {
    timestamp: string;
    equity: number;
    drawdown: number;
    date?: string;
    time?: string;
    equityFormatted?: string;
    drawdownFormatted?: string;
}

// DCE (Deterministic Copy Execution) Types
export interface DCETrigger {
    type: 'time' | 'price' | 'signal' | 'portfolio';
    params: {
        // Time-based triggers
        schedule?: string; // cron expression
        timezone?: string;
        
        // Price-based triggers
        symbol?: string;
        exchange?: string;
        condition?: 'above' | 'below' | 'crosses';
        price?: number;
        
        // Signal-based triggers
        signal_id?: string;
        confidence_threshold?: number;
        
        // Portfolio-based triggers
        total_pnl_threshold?: number;
        drawdown_threshold?: number;
        position_count?: number;
    };
}

export interface DCEAction {
    type: 'buy' | 'sell' | 'close' | 'rebalance';
    params: {
        symbol: string;
        exchange: string;
        quantity?: number;
        quantity_type?: 'fixed' | 'percentage' | 'risk_based';
        price_type?: 'market' | 'limit' | 'stop';
        price?: number;
        stop_loss?: number;
        take_profit?: number[];
        time_in_force?: 'GTC' | 'IOC' | 'FOK';
    };
}

export interface DCEConstraints {
    max_position_size: number;
    max_daily_trades: number;
    max_drawdown_percentage: number;
    allowed_symbols: string[];
    allowed_exchanges: string[];
    trading_hours?: {
        start: string;
        end: string;
        timezone: string;
    };
    cooldown_period_ms?: number;
}

export interface DCEPlan {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    trigger: DCETrigger;
    actions: DCEAction[];
    constraints: DCEConstraints;
    deterministic_hash: string;
    status: 'active' | 'paused' | 'stopped';
    execution_count: number;
    total_pnl: number;
    last_executed_at?: string;
    created_at: string;
    updated_at: string;
}

export interface DCEExecution {
    id: string;
    plan_id: string;
    trigger_data: Record<string, any>;
    execution_hash: string;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    orders_data?: Record<string, any>;
    actual_pnl?: number;
    execution_time_ms?: number;
    error_message?: string;
    created_at: string;
    completed_at?: string;
}

// Verifiable PnL Types
export interface MerkleProof {
    leaf: string;
    proof: string[];
    position: number;
}

export interface PnLSnapshot {
    id: string;
    user_id: string;
    snapshot_type: 'daily' | 'weekly' | 'monthly' | 'execution';
    period_start: string;
    period_end: string;
    total_pnl: number;
    realized_pnl: number;
    unrealized_pnl: number;
    trade_count: number;
    positions_data: Record<string, any>;
    merkle_root: string;
    merkle_proof: MerkleProof;
    verified: boolean;
    created_at: string;
}

// Strategy Sharing Types
export interface VerificationBadge {
    type: 'verified_trader' | 'audited_strategy' | 'performance_validated' | 'risk_assessed';
    issued_by: string;
    issued_at: string;
    expires_at?: string;
    metadata?: Record<string, any>;
}

export interface SharedStrategy {
    id: string;
    owner_id: string;
    plan_id: string;
    title: string;
    description?: string;
    category?: string;
    tags: string[];
    price: number;
    verification_badges: string[];
    performance_data: {
        total_return: number;
        sharpe_ratio: number;
        max_drawdown: number;
        win_rate: number;
        avg_monthly_return: number;
        volatility: number;
    };
    risk_metrics: {
        var_95: number;
        var_99: number;
        max_position_risk: number;
        correlation_btc: number;
        leverage_usage: number;
    };
    subscriber_count: number;
    avg_rating: number;
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

export interface StrategySubscription {
    id: string;
    subscriber_id: string;
    strategy_id: string;
    allocation_percentage: number;
    risk_multiplier: number;
    status: 'active' | 'paused' | 'stopped';
    total_pnl: number;
    subscription_fee_paid: number;
    created_at: string;
    updated_at: string;
}

// Enhanced Connection Health Types
export interface EnhancedConnectionHealth {
    id: string;
    user_id: string;
    exchange: string;
    status: 'healthy' | 'degraded' | 'critical' | 'offline';
    latency_ms?: number;
    success_rate?: number;
    error_count: number;
    last_error?: string;
    websocket_connected: boolean;
    rate_limit_remaining?: number;
    rate_limit_reset?: string;
    last_check: string;
    created_at: string;
}

// Updated Trade interface for Dashboard compatibility
export interface TradeForDashboard extends Trade {
    symbol: string;
    quantity: number;
    entryPrice: number;
    createdAt: string;
}

// Connection Health with dashboard fields


// PnL State for Zustand Store
export interface PnLState {
    total: number;
    percentage: number;
    daily: number;
    weekly: number;
    monthly: number;
}

// User Settings Interface
export interface UserSettings {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    timezone: string;
    language: string;
    theme: 'light' | 'dark' | 'system';
    currency: string;
    notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
        webhook: boolean;
        marketing: boolean;
    };
    security: {
        twoFactorEnabled: boolean;
        sessionTimeout: number;
        loginNotifications: boolean;
        suspiciousActivityAlerts: boolean;
    };
    trading: {
        defaultRiskLevel: 'low' | 'medium' | 'high';
        autoConfirmTrades: boolean;
        maxPositionSize: number;
        stopLossPercentage: number;
    };
    subscription: {
        plan: 'basic' | 'pro' | 'elite';
        status: 'active' | 'cancelled' | 'expired';
        nextBilling: string;
        amount: number;
    };
}
