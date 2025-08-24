// apps/api/src/lib/redis.ts
import { createClient, RedisClientType } from "redis";
import { env } from "./env";
import { logger } from "./logger";

// Redis client configuration
const redisConfig = {
    url: `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`,
    password: env.REDIS_PASSWORD || undefined,
    database: env.REDIS_DB,
    socket: {
        connectTimeout: 10000,
        timeout: 10000,
    },
    retry_strategy: (options: any) => {
        if (options.error && options.error.code === "ECONNREFUSED") {
            logger.error("Redis server refused connection");
            return new Error("Redis server refused connection");
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            logger.error("Redis retry time exhausted");
            return new Error("Redis retry time exhausted");
        }
        if (options.attempt > 10) {
            logger.error("Redis max retry attempts reached");
            return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
    },
};

// Create Redis client
export const redisClient: RedisClientType = createClient(redisConfig);

// Handle Redis events
redisClient.on("connect", () => {
    logger.info("Connected to Redis");
});

redisClient.on("ready", () => {
    logger.info("Redis client ready");
});

redisClient.on("error", (err) => {
    logger.error({ error: err.message, stack: err.stack }, "Redis client error");
});

redisClient.on("end", () => {
    logger.info("Redis client disconnected");
});

redisClient.on("reconnecting", () => {
    logger.info("Redis client reconnecting...");
});

// Connect to Redis
export const connectRedis = async (): Promise<void> => {
    try {
        await redisClient.connect();
        logger.info("Redis connection established");
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, "Failed to connect to Redis");
        throw error;
    }
};

// Disconnect from Redis
export const disconnectRedis = async (): Promise<void> => {
    try {
        await redisClient.quit();
        logger.info("Redis connection closed");
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, "Failed to disconnect from Redis");
        throw error;
    }
};

// Graceful shutdown
export const closeRedis = async (): Promise<void> => {
    try {
        await redisClient.disconnect();
        logger.info("Redis client disconnected");
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, "Failed to disconnect Redis client");
        throw error;
    }
};

// Health check function
export const checkRedisHealth = async (): Promise<boolean> => {
    try {
        const result = await redisClient.ping();
        return result === "PONG";
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, "Redis health check failed");
        return false;
    }
};

// Helper function to get Redis info
export const getRedisInfo = async (): Promise<Record<string, any>> => {
    try {
        const info = await redisClient.info();
        const lines = info.split("\r\n");
        const result: Record<string, any> = {};

        for (const line of lines) {
            if (line.includes(":")) {
                const [key, value] = line.split(":");
                if (key && value) {
                    result[key] = value;
                }
            }
        }

        return result;
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, "Failed to get Redis info");
        return {};
    }
};

// Helper function to get Redis memory usage
export const getRedisMemoryUsage = async (): Promise<number> => {
    try {
        const info = await getRedisInfo();
        return parseInt(info.used_memory_human || "0", 10);
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, "Failed to get Redis memory usage");
        return 0;
    }
};

// Helper function to get Redis key count
export const getRedisKeyCount = async (): Promise<number> => {
    try {
        const info = await getRedisInfo();
        return parseInt(info.db0 || "0", 10);
    } catch (error) {
        logger.error({ error: error instanceof Error ? error.message : String(error) }, "Failed to get Redis key count");
        return 0;
    }
};

// Export types
export type { RedisClientType };
export { redisClient as client };
