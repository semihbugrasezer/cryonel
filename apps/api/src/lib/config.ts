// apps/api/src/lib/config.ts
import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env' });

// Environment variable schema
const envSchema = z.object({
    // General
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    APP_URL: z.string().url().default("http://localhost:3000"),
    ENCRYPTION_MASTER_KEY: z.string().length(64),
    PORT: z.coerce.number().int().positive().default(8080),
    REGION: z.enum(["eu", "asia"]).default("eu"),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

    // Database
    POSTGRES_HOST: z.string().default("localhost"),
    POSTGRES_PORT: z.coerce.number().int().positive().default(5432),
    POSTGRES_USER: z.string().min(1),
    POSTGRES_PASSWORD: z.string().min(1),
    POSTGRES_DB: z.string().min(1),
    POSTGRES_SSL: z.coerce.boolean().default(false),
    POSTGRES_SSL_CA: z.string().optional(),
    POSTGRES_SSL_CERT: z.string().optional(),
    POSTGRES_SSL_KEY: z.string().optional(),

    // Redis
    REDIS_HOST: z.string().default("localhost"),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_DB: z.coerce.number().int().min(0).max(15).default(0),

    // JWT Configuration - Use proper JWT time formats
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_TTL: z.string().default("15m"), // 15 minutes
    JWT_REFRESH_TTL: z.string().default("7d"), // 7 days
    JWT_REFRESH_TTL_MS: z.coerce.number().int().positive().default(7 * 24 * 60 * 60 * 1000), // 7 days in milliseconds

    // CORS
    ALLOWED_ORIGINS: z.string().default("http://localhost:3000,http://localhost:3001").transform(val =>
        val.split(",").map(origin => origin.trim())
    ),

    // External APIs
    COINGECKO_API_KEY: z.string().optional(),
    SOLANA_RPC_ENDPOINT: z.string().url().optional(),
    SOLANA_RPC_FALLBACK: z.string().url().optional(),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

// Export validated configuration
export const config = {
    NODE_ENV: env.NODE_ENV,
    APP_URL: env.APP_URL,
    ENCRYPTION_MASTER_KEY: env.ENCRYPTION_MASTER_KEY,
    PORT: env.PORT,
    REGION: env.REGION,
    LOG_LEVEL: env.LOG_LEVEL,

    // Database
    POSTGRES: {
        host: env.POSTGRES_HOST,
        port: env.POSTGRES_PORT,
        user: env.POSTGRES_USER,
        password: env.POSTGRES_PASSWORD,
        database: env.POSTGRES_DB,
        ssl: env.POSTGRES_SSL,
        sslCA: env.POSTGRES_SSL_CA,
        sslCert: env.POSTGRES_SSL_CERT,
        sslKey: env.POSTGRES_SSL_KEY,
    },

    // Redis
    REDIS: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
        db: env.REDIS_DB,
    },

    // JWT - Use proper JWT time formats
    JWT_SECRET: env.JWT_SECRET,
    JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
    JWT_ACCESS_TTL: env.JWT_ACCESS_TTL,
    JWT_REFRESH_TTL: env.JWT_REFRESH_TTL,
    JWT_REFRESH_TTL_MS: env.JWT_REFRESH_TTL_MS,

    // CORS
    ALLOWED_ORIGINS: env.ALLOWED_ORIGINS,

    // External APIs
    COINGECKO_API_KEY: env.COINGECKO_API_KEY,
    SOLANA_RPC_ENDPOINT: env.SOLANA_RPC_ENDPOINT,
    SOLANA_RPC_FALLBACK: env.SOLANA_RPC_FALLBACK,
};

export default config;
