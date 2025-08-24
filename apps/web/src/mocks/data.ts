import { Trade, Position, Strategy, Signal, Master, CEXApiKey, Wallet, PerformanceMetrics } from '../types';

// Generate realistic mock data
export const generateMockTrades = (count: number = 50): Trade[] => {
    const exchanges = ['binance', 'bybit', 'kraken', 'okx'];
    const markets = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'DOT/USDT'];
    const sides = ['buy', 'sell'] as const;
    const statuses = ['open', 'closed', 'cancelled'] as const;

    return Array.from({ length: count }, (_, i) => {
        const side = sides[Math.floor(Math.random() * sides.length)];
        const entryPrice = 20000 + Math.random() * 50000;
        const currentPrice = entryPrice * (1 + (Math.random() - 0.5) * 0.1);
        const size = 0.1 + Math.random() * 2;
        const pnl = (currentPrice - entryPrice) * size * (side === 'buy' ? 1 : -1);
        const pnlPercentage = (pnl / (entryPrice * size)) * 100;
        const spread = Math.random() * 0.5;
        const fees = (entryPrice * size) * 0.001;

        return {
            id: `trade_${i + 1}`,
            exchange: exchanges[Math.floor(Math.random() * exchanges.length)],
            market: markets[Math.floor(Math.random() * markets.length)],
            side,
            size,
            entry_price: entryPrice,
            current_price: currentPrice,
            pnl,
            pnl_percentage: pnlPercentage,
            spread,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            fees,
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            closed_at: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
            txid: Math.random() > 0.5 ? `tx_${Math.random().toString(36).substr(2, 9)}` : undefined,
        };
    });
};

export const generateMockPositions = (count: number = 10): Position[] => {
    const markets = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'DOT/USDT'];
    const sides = ['long', 'short'] as const;

    return Array.from({ length: count }, (_, i) => {
        const side = sides[Math.floor(Math.random() * sides.length)];
        const entryPrice = 20000 + Math.random() * 50000;
        const markPrice = entryPrice * (1 + (Math.random() - 0.5) * 0.15);
        const size = 0.1 + Math.random() * 2;
        const unrealizedPnl = (markPrice - entryPrice) * size * (side === 'long' ? 1 : -1);
        const unrealizedPnlPercentage = (unrealizedPnl / (entryPrice * size)) * 100;
        const liquidationPrice = entryPrice * (1 + (side === 'long' ? -0.8 : 0.8));

        return {
            id: `position_${i + 1}`,
            market: markets[Math.floor(Math.random() * markets.length)],
            side,
            size,
            entry_price: entryPrice,
            mark_price: markPrice,
            unrealized_pnl: unrealizedPnl,
            unrealized_pnl_percentage: unrealizedPnlPercentage,
            liquidation_price: liquidationPrice,
            created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
    });
};

export const generateMockStrategies = (count: number = 15): Strategy[] => {
    const strategyTypes = ['arbitrage', 'copy', 'custom'] as const;
    const statuses = ['active', 'paused', 'stopped'] as const;

    return Array.from({ length: count }, (_, i) => {
        const type = strategyTypes[Math.floor(Math.random() * strategyTypes.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const sharpeRatio = 0.5 + Math.random() * 2.5;
        const maxDrawdown = Math.random() * 0.3;
        const winRate = 0.4 + Math.random() * 0.4;
        const totalTrades = 50 + Math.floor(Math.random() * 500);
        const profitFactor = 0.8 + Math.random() * 1.5;

        return {
            id: `strategy_${i + 1}`,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} Strategy ${i + 1}`,
            description: `A ${type} trading strategy with advanced risk management and automated execution.`,
            type,
            status,
            metrics: {
                sharpe_ratio: sharpeRatio,
                max_drawdown: maxDrawdown,
                win_rate: winRate,
                total_trades: totalTrades,
                profit_factor: profitFactor,
            },
            fees: {
                setup: type === 'arbitrage' ? 0 : 50 + Math.random() * 200,
                monthly: type === 'arbitrage' ? 0 : 20 + Math.random() * 100,
                performance: type === 'arbitrage' ? 0.1 : 0.15 + Math.random() * 0.1,
            },
            risk_limits: {
                max_position_size: 1000 + Math.random() * 10000,
                max_drawdown: 0.1 + Math.random() * 0.2,
                stop_loss: 0.05 + Math.random() * 0.15,
            },
            created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
    });
};

export const generateMockSignals = (count: number = 25): Signal[] => {
    const markets = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'DOT/USDT'];
    const types = ['buy', 'sell', 'close'] as const;

    return Array.from({ length: count }, (_, i) => {
        const type = types[Math.floor(Math.random() * types.length)];
        const market = markets[Math.floor(Math.random() * markets.length)];
        const confidence = 0.6 + Math.random() * 0.4;
        const entryPrice = 20000 + Math.random() * 50000;
        const stopLoss = entryPrice * (1 + (Math.random() - 0.5) * 0.1);
        const takeProfit = [
            entryPrice * (1 + (Math.random() * 0.1 + 0.05)),
            entryPrice * (1 + (Math.random() * 0.2 + 0.15)),
        ];

        return {
            id: `signal_${i + 1}`,
            strategy_id: `strategy_${Math.floor(Math.random() * 15) + 1}`,
            type,
            market,
            confidence,
            payload: {
                entry_price: type !== 'close' ? entryPrice : undefined,
                stop_loss: type !== 'close' ? stopLoss : undefined,
                take_profit: type !== 'close' ? takeProfit : undefined,
                size: type !== 'close' ? 0.1 + Math.random() * 2 : undefined,
            },
            created_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
            expires_at: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        };
    });
};

export const generateMockMasters = (count: number = 8): Master[] => {
    return Array.from({ length: count }, (_, i) => {
        const totalReturn = (Math.random() - 0.3) * 2; // -30% to +170%
        const monthlyReturn = (Math.random() - 0.1) * 0.4; // -10% to +30%
        const maxDrawdown = Math.random() * 0.4;
        const sharpeRatio = 0.5 + Math.random() * 2.5;
        const followersCount = Math.floor(Math.random() * 1000);
        const totalAum = 10000 + Math.random() * 1000000;

        return {
            id: `master_${i + 1}`,
            user_id: `user_${i + 1}`,
            username: `MasterTrader${i + 1}`,
            strategy_id: `strategy_${i + 1}`,
            followers_count: followersCount,
            total_aum: totalAum,
            performance: {
                total_return: totalReturn,
                monthly_return: monthlyReturn,
                max_drawdown: maxDrawdown,
                sharpe_ratio: sharpeRatio,
            },
            fees: {
                setup: 100 + Math.random() * 400,
                monthly: 50 + Math.random() * 150,
                performance: 0.15 + Math.random() * 0.1,
            },
            created_at: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
        };
    });
};

export const generateMockCEXApiKeys = (): CEXApiKey[] => {
    const exchanges = ['binance', 'bybit', 'kraken', 'okx'];

    return exchanges.map((exchange, i) => ({
        id: `cex_key_${i + 1}`,
        exchange,
        key_enc: `encrypted_key_${i + 1}`,
        secret_enc: `encrypted_secret_${i + 1}`,
        can_withdraw: false,
        permissions: ['read', 'trade'],
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        last_used: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : undefined,
    }));
};

export const generateMockWallets = (): Wallet[] => {
    const networks = ['ethereum', 'polygon', 'bsc', 'solana'];
    const types = ['metamask', 'phantom', 'rabby'] as const;

    return networks.map((network, i) => ({
        id: `wallet_${i + 1}`,
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        network,
        type: types[i % types.length],
        connected: Math.random() > 0.5,
        balance: Math.random() > 0.3 ? Math.random() * 10 : undefined,
        last_sync: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : undefined,
    }));
};

export const generateMockPerformanceMetrics = (): PerformanceMetrics => {
    const totalReturn = (Math.random() - 0.2) * 1.5; // -20% to +130%
    const dailyReturn = (Math.random() - 0.05) * 0.2; // -5% to +15%
    const weeklyReturn = (Math.random() - 0.1) * 0.4; // -10% to +30%
    const monthlyReturn = (Math.random() - 0.15) * 0.6; // -15% to +45%
    const yearlyReturn = totalReturn;

    return {
        win_rate: (0.45 + Math.random() * 0.4),
        sharpe_ratio: 0.8 + Math.random() * 2.2,
        max_drawdown: Math.random() * 0.3,
        total_return: totalReturn,
        daily_return: dailyReturn,
        weekly_return: weeklyReturn,
        monthly_return: monthlyReturn,
        yearly_return: yearlyReturn,
        profit_factor: 0.9 + Math.random() * 1.6,
        average_trade: (Math.random() - 0.5) * 200,
        total_trades: 150 + Math.floor(Math.random() * 850),
        profitable_trades: Math.floor((0.45 + Math.random() * 0.4) * (150 + Math.floor(Math.random() * 850))),
        losing_trades: 0,
    };
};

// Export all mock data
export const mockData = {
    trades: generateMockTrades(100),
    positions: generateMockPositions(15),
    strategies: generateMockStrategies(20),
    signals: generateMockSignals(30),
    masters: generateMockMasters(10),
    cexApiKeys: generateMockCEXApiKeys(),
    wallets: generateMockWallets(),
    performanceMetrics: generateMockPerformanceMetrics(),
};

// Mock data for testing components

export const mockPnLData = [
    { timestamp: "2024-01-01T00:00:00Z", pnl: 150.25, cumulative: 150.25, trades: 5 },
    { timestamp: "2024-01-01T06:00:00Z", pnl: -75.50, cumulative: 74.75, trades: 8 },
    { timestamp: "2024-01-01T12:00:00Z", pnl: 200.00, cumulative: 274.75, trades: 12 },
    { timestamp: "2024-01-01T18:00:00Z", pnl: -50.25, cumulative: 224.50, trades: 15 },
    { timestamp: "2024-01-02T00:00:00Z", pnl: 300.75, cumulative: 525.25, trades: 20 },
    { timestamp: "2024-01-02T06:00:00Z", pnl: 125.50, cumulative: 650.75, trades: 25 },
    { timestamp: "2024-01-02T12:00:00Z", pnl: -100.00, cumulative: 550.75, trades: 30 },
    { timestamp: "2024-01-02T18:00:00Z", pnl: 250.25, cumulative: 801.00, trades: 35 },
];

export const mockLatencyData = [
    { timestamp: "2024-01-01T00:00:00Z", venue: "binance", latency: 45, status: "success" },
    { timestamp: "2024-01-01T00:01:00Z", venue: "bybit", latency: 78, status: "success" },
    { timestamp: "2024-01-01T00:02:00Z", venue: "kraken", latency: 120, status: "success" },
    { timestamp: "2024-01-01T00:03:00Z", venue: "binance", latency: 52, status: "success" },
    { timestamp: "2024-01-01T00:04:00Z", venue: "bybit", latency: 95, status: "timeout" },
    { timestamp: "2024-01-01T00:05:00Z", venue: "kraken", latency: 88, status: "success" },
    { timestamp: "2024-01-01T00:06:00Z", venue: "binance", latency: 48, status: "success" },
    { timestamp: "2024-01-01T00:07:00Z", venue: "bybit", latency: 82, status: "success" },
];

const mockSpreadTimeSeries = Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
    spread: Math.random() * 0.5 + 0.05,
    volume: Math.random() * 1000000 + 100000,
}));

export const mockSpreadData = [
    { symbol: "BTC/USDT", currentSpread: 0.15, data: mockSpreadTimeSeries },
    { symbol: "ETH/USDT", currentSpread: 0.08, data: mockSpreadTimeSeries },
    { symbol: "SOL/USDT", currentSpread: 0.25, data: mockSpreadTimeSeries },
    { symbol: "ADA/USDT", currentSpread: 0.12, data: mockSpreadTimeSeries },
];

export const mockTrades = [
    {
        id: "trade_001",
        symbol: "BTC/USDT",
        side: "buy" as const,
        quantity: 0.5,
        price: 45000,
        fees: 11.25,
        timestamp: "2024-01-01T10:30:00Z",
        status: "completed" as const,
        venue: "binance",
        txid: "0x1234567890abcdef",
    },
    {
        id: "trade_002",
        symbol: "ETH/USDT",
        side: "sell" as const,
        quantity: 2.0,
        price: 2800,
        fees: 2.8,
        timestamp: "2024-01-01T11:15:00Z",
        status: "completed" as const,
        venue: "kraken",
        txid: "0xabcdef1234567890",
    },
    {
        id: "trade_003",
        symbol: "SOL/USDT",
        side: "buy" as const,
        quantity: 100,
        price: 95,
        fees: 4.75,
        timestamp: "2024-01-01T12:00:00Z",
        status: "pending" as const,
        venue: "bybit",
    },
];

export const mockStrategies = [
    {
        id: "strat_001",
        name: "Solana Arbitrage",
        type: "arbitrage",
        baseAsset: "SOL",
        quoteAsset: "USDT",
        exchanges: ["binance", "bybit"],
        riskLevel: "medium",
        maxInvestment: 1000,
        isActive: true,
        pnl: 125.50,
        trades: 15,
    },
    {
        id: "strat_002",
        name: "BTC Grid Trading",
        type: "grid",
        baseAsset: "BTC",
        quoteAsset: "USDT",
        exchanges: ["binance", "kraken"],
        riskLevel: "low",
        maxInvestment: 500,
        isActive: true,
        pnl: 75.25,
        trades: 8,
    },
    {
        id: "strat_003",
        name: "ETH Copy Trading",
        type: "copy-trading",
        baseAsset: "ETH",
        quoteAsset: "USDT",
        exchanges: ["binance"],
        riskLevel: "high",
        maxInvestment: 2000,
        isActive: false,
        pnl: -150.00,
        trades: 12,
    },
];

export const mockExchanges = [
    { name: "binance", status: "connected", balance: 5000, lastSync: "2 minutes ago" },
    { name: "bybit", status: "connected", balance: 2500, lastSync: "1 minute ago" },
    { name: "kraken", status: "disconnected", balance: 0, lastSync: "Never" },
    { name: "coinbase", status: "connected", balance: 1000, lastSync: "5 minutes ago" },
];

export const mockWalletInfo = {
    address: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    chain: "Ethereum",
    balance: "2.5 ETH",
    isConnected: true,
};
