// apps/api/src/lib/env.ts
import { z } from "zod";

// Environment variable schema validation
export const EnvSchema = z.object({
    // General
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    APP_URL: z.string().url(),
    PORT: z.string().transform(Number).default("8080"),
    REGION: z.enum(["eu", "asia", "us"]).default("eu"),

    // Database
    POSTGRES_HOST: z.string(),
    POSTGRES_PORT: z.string().transform(Number).default("5432"),
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string(),
    POSTGRES_DB: z.string(),
    POSTGRES_SSL: z.string().transform(val => val === "true").default("false"),

    // Redis
    REDIS_HOST: z.string(),
    REDIS_PORT: z.string().transform(Number).default("6379"),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_DB: z.string().transform(Number).default("0"),

    // JWT Configuration
    JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
    JWT_REFRESH_SECRET: z.string().min(32, "JWT refresh secret must be at least 32 characters"),
    JWT_ACCESS_TTL: z.string().transform(Number).default("900"), // 15 minutes
    JWT_REFRESH_TTL: z.string().transform(Number).default("604800"), // 7 days

    // Encryption
    ENCRYPTION_MASTER_KEY: z.string().length(64, "Encryption key must be exactly 64 characters"),

    // Stripe (optional)
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_PUBLISHABLE_KEY: z.string().optional(),

    // Solana RPC
    SOLANA_RPC_PRIMARY: z.string().url().optional(),
    SOLANA_RPC_FALLBACK: z.string().url().optional(),

    // Logging
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

    // Rate Limiting
    RATE_LIMIT_AUTH: z.string().transform(Number).default("10"),
    RATE_LIMIT_TRADING: z.string().transform(Number).default("60"),
    RATE_LIMIT_WINDOW: z.string().transform(Number).default("60"),

    // OAuth Configuration
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    API_BASE_URL: z.string().url(),
    
    // Monitoring
    PROMETHEUS_ENABLED: z.string().transform(val => val === "true").default("true"),
    GRAFANA_ENABLED: z.string().transform(val => val === "true").default("true"),
    LOKI_ENABLED: z.string().transform(val => val === "true").default("true"),
});

// Parse and validate environment variables
export const env = EnvSchema.parse(process.env);

// Export typed environment variables
export type Env = z.infer<typeof EnvSchema>;

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (feature: keyof Pick<Env, 'PROMETHEUS_ENABLED' | 'GRAFANA_ENABLED' | 'LOKI_ENABLED'>): boolean => {
    return env[feature];
};

// Helper function to get database connection string
export const getDatabaseUrl = (): string => {
    const { POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_SSL } = env;
    const ssl = POSTGRES_SSL ? "?sslmode=require" : "";
    return `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}${ssl}`;
};

// Helper function to get Redis connection URL
export const getRedisUrl = (): string => {
    const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB } = env;
    const auth = REDIS_PASSWORD ? `:${REDIS_PASSWORD}@` : "";
    return `redis://${auth}${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}`;
};
