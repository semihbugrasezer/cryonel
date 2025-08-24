// apps/workers/arb/src/config.ts
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    REGION: process.env.REGION || 'eu',

    // Redis configuration
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

    // Database configuration
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/cryonel',

    // Exchange API configuration
    EXCHANGE_API_KEY: process.env.EXCHANGE_API_KEY,
    EXCHANGE_SECRET: process.env.EXCHANGE_SECRET,

    // Worker configuration
    WORKER_INTERVAL: parseInt(process.env.WORKER_INTERVAL || '5000'),
    MAX_CONCURRENT_JOBS: parseInt(process.env.MAX_CONCURRENT_JOBS || '10'),

    // Health check configuration
    HEALTH_CHECK_INTERVAL: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),

    // Metrics configuration
    METRICS_PORT: parseInt(process.env.METRICS_PORT || '8080'),
};
