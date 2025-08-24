import { z } from 'zod';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

// Environment variable schema validation
const EnvSchema = z.object({
    // General
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    REGION: z.enum(['eu', 'asia', 'us']).default('eu'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    // Database
    POSTGRES_HOST: z.string().default('localhost'),
    POSTGRES_PORT: z.string().transform(Number).default('5432'),
    POSTGRES_USER: z.string().default('cryonel'),
    POSTGRES_PASSWORD: z.string().default(''),
    POSTGRES_DB: z.string().default('cryonel'),
    POSTGRES_SSL: z.string().transform(val => val === 'true').default('false'),

    // Redis
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.string().transform(Number).default('6379'),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_DB: z.string().transform(Number).default('0'),

    // Exchange API Keys (encrypted)
    BINANCE_API_KEY: z.string().optional(),
    BINANCE_SECRET_KEY: z.string().optional(),
    KUCOIN_API_KEY: z.string().optional(),
    KUCOIN_SECRET_KEY: z.string().optional(),
    KUCOIN_PASSPHRASE: z.string().optional(),
    KRAKEN_API_KEY: z.string().optional(),
    KRAKEN_SECRET_KEY: z.string().optional(),

    // Solana RPC
    SOLANA_RPC_URL: z.string().default('https://api.mainnet-beta.solana.com'),
    SOLANA_WS_URL: z.string().optional(),

    // Jupiter API
    JUPITER_API_URL: z.string().default('https://quote-api.jup.ag/v6'),

    // Worker Configuration
    SCAN_INTERVAL_MS: z.string().transform(Number).default('1000'),
    MAX_OPPORTUNITIES_PER_SCAN: z.string().transform(Number).default('10'),
    MIN_PROFIT_THRESHOLD: z.string().transform(Number).default('0.5'),
    MAX_SLIPPAGE: z.string().transform(Number).default('0.1'),
    MIN_TRADE_SIZE: z.string().transform(Number).default('0.001'),
    MAX_TRADE_SIZE: z.string().transform(Number).default('1000'),
    AUTO_EXECUTE_ARBITRAGE: z.string().transform(val => val === 'true').default('false'),
    MAX_CONCURRENT_TRADES: z.string().transform(Number).default('5'),
    EXECUTION_DELAY_MS: z.string().transform(Number).default('100'),

    // Health Check
    HEALTH_CHECK_INTERVAL_MS: z.string().transform(Number).default('30000'),

    // Metrics
    METRICS_COLLECTION_INTERVAL_MS: z.string().transform(Number).default('60000'),

    // Rate Limiting
    MAX_REQUESTS_PER_SECOND: z.string().transform(Number).default('10'),
    MAX_REQUESTS_PER_MINUTE: z.string().transform(Number).default('600'),

    // Timeouts
    REQUEST_TIMEOUT_MS: z.string().transform(Number).default('10000'),
    ORDER_TIMEOUT_MS: z.string().transform(Number).default('30000'),

    // Retry Configuration
    MAX_RETRIES: z.string().transform(Number).default('3'),
    RETRY_DELAY_MS: z.string().transform(Number).default('1000'),

    // Monitoring
    SENTRY_DSN: z.string().optional(),
    SENTRY_ENVIRONMENT: z.string().optional(),

    // WebSocket
    WS_RECONNECT_INTERVAL_MS: z.string().transform(Number).default('5000'),
    WS_MAX_RECONNECT_ATTEMPTS: z.string().transform(Number).default('10'),
});

// Parse and validate environment variables
const env = EnvSchema.parse(process.env);

// Configuration object
export const config = {
    // General
    NODE_ENV: env.NODE_ENV,
    REGION: env.REGION,
    LOG_LEVEL: env.LOG_LEVEL,

    // Database
    database: {
        host: env.POSTGRES_HOST,
        port: env.POSTGRES_PORT,
        user: env.POSTGRES_USER,
        password: env.POSTGRES_PASSWORD,
        database: env.POSTGRES_DB,
        ssl: env.POSTGRES_SSL,
    },

    // Redis
    redis: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
        database: env.REDIS_DB,
    },

    // Exchange API Keys
    exchanges: {
        binance: {
            apiKey: env.BINANCE_API_KEY,
            secretKey: env.BINANCE_SECRET_KEY,
        },
        kucoin: {
            apiKey: env.KUCOIN_API_KEY,
            secretKey: env.KUCOIN_SECRET_KEY,
            passphrase: env.KUCOIN_PASSPHRASE,
        },
        kraken: {
            apiKey: env.KRAKEN_API_KEY,
            secretKey: env.KRAKEN_SECRET_KEY,
        },
    },

    // Solana
    solana: {
        rpcUrl: env.SOLANA_RPC_URL,
        wsUrl: env.SOLANA_WS_URL,
    },

    // Jupiter
    jupiter: {
        apiUrl: env.JUPITER_API_URL,
    },

    // Worker Configuration
    SCAN_INTERVAL_MS: env.SCAN_INTERVAL_MS,
    MAX_OPPORTUNITIES_PER_SCAN: env.MAX_OPPORTUNITIES_PER_SCAN,
    MIN_PROFIT_THRESHOLD: env.MIN_PROFIT_THRESHOLD,
    MAX_SLIPPAGE: env.MAX_SLIPPAGE,
    MIN_TRADE_SIZE: env.MIN_TRADE_SIZE,
    MAX_TRADE_SIZE: env.MAX_TRADE_SIZE,
    AUTO_EXECUTE_ARBITRAGE: env.AUTO_EXECUTE_ARBITRAGE,
    MAX_CONCURRENT_TRADES: env.MAX_CONCURRENT_TRADES,
    EXECUTION_DELAY_MS: env.EXECUTION_DELAY_MS,

    // Health Check
    HEALTH_CHECK_INTERVAL_MS: env.HEALTH_CHECK_INTERVAL_MS,

    // Metrics
    METRICS_COLLECTION_INTERVAL_MS: env.METRICS_COLLECTION_INTERVAL_MS,

    // Rate Limiting
    MAX_REQUESTS_PER_SECOND: env.MAX_REQUESTS_PER_SECOND,
    MAX_REQUESTS_PER_MINUTE: env.MAX_REQUESTS_PER_MINUTE,

    // Timeouts
    REQUEST_TIMEOUT_MS: env.REQUEST_TIMEOUT_MS,
    ORDER_TIMEOUT_MS: env.ORDER_TIMEOUT_MS,

    // Retry Configuration
    MAX_RETRIES: env.MAX_RETRIES,
    RETRY_DELAY_MS: env.RETRY_DELAY_MS,

    // Monitoring
    sentry: {
        dsn: env.SENTRY_DSN,
        environment: env.SENTRY_ENVIRONMENT,
    },

    // WebSocket
    WS_RECONNECT_INTERVAL_MS: env.WS_RECONNECT_INTERVAL_MS,
    WS_MAX_RECONNECT_ATTEMPTS: env.WS_MAX_RECONNECT_ATTEMPTS,

    // Exchange-specific configurations
    exchangeConfigs: {
        binance: {
            name: 'Binance',
            type: 'cex' as const,
            region: 'global' as const,
            reliability: 0.95,
            riskRating: 0.1,
            feeRate: 0.001, // 0.1%
            avgLatency: 50,
            maxTradeSize: 1000000,
            minTradeSize: 0.00001,
            rateLimits: {
                requestsPerSecond: 10,
                requestsPerMinute: 1200,
            },
        },
        kucoin: {
            name: 'KuCoin',
            type: 'cex' as const,
            region: 'global' as const,
            reliability: 0.9,
            riskRating: 0.15,
            feeRate: 0.001, // 0.1%
            avgLatency: 80,
            maxTradeSize: 500000,
            minTradeSize: 0.00001,
            rateLimits: {
                requestsPerSecond: 10,
                requestsPerMinute: 600,
            },
        },
        kraken: {
            name: 'Kraken',
            type: 'cex' as const,
            region: 'global' as const,
            reliability: 0.92,
            riskRating: 0.12,
            feeRate: 0.0026, // 0.26%
            avgLatency: 70,
            maxTradeSize: 1000000,
            minTradeSize: 0.00001,
            rateLimits: {
                requestsPerSecond: 15,
                requestsPerMinute: 900,
            },
        },
        jupiter: {
            name: 'Jupiter',
            type: 'dex' as const,
            region: 'global' as const,
            reliability: 0.88,
            riskRating: 0.2,
            feeRate: 0.003, // 0.3%
            avgLatency: 200,
            maxTradeSize: 100000,
            minTradeSize: 0.001,
            rateLimits: {
                requestsPerSecond: 20,
                requestsPerMinute: 1200,
            },
        },
        raydium: {
            name: 'Raydium',
            type: 'dex' as const,
            region: 'global' as const,
            reliability: 0.85,
            riskRating: 0.25,
            feeRate: 0.0025, // 0.25%
            avgLatency: 250,
            maxTradeSize: 50000,
            minTradeSize: 0.001,
            rateLimits: {
                requestsPerSecond: 15,
                requestsPerMinute: 900,
            },
        },
    },

    // Trading pairs configuration
    tradingPairs: [
        'BTC/USDT',
        'ETH/USDT',
        'SOL/USDT',
        'SOL/USDC',
        'ETH/USDC',
        'BTC/USDC',
        'MATIC/USDT',
        'AVAX/USDT',
        'DOT/USDT',
        'LINK/USDT',
    ],

    // Risk management
    riskManagement: {
        maxDailyLoss: 1000, // USD
        maxDrawdown: 0.1, // 10%
        maxPositionSize: 0.1, // 10% of portfolio
        stopLossPercentage: 0.05, // 5%
        takeProfitPercentage: 0.1, // 10%
    },

    // Performance thresholds
    performance: {
        minWinRate: 0.6, // 60%
        minSharpeRatio: 1.0,
        maxDrawdown: 0.15, // 15%
        targetAnnualReturn: 0.3, // 30%
    },
};

// Export the validated environment variables
export { env };

// Export configuration as default
export default config;
