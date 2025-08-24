// apps/workers/arb/src/lib/redis-manager.ts
import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

export class RedisManager {
    private client: RedisClientType;
    private isConnected = false;

    constructor() {
        this.client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        this.client.on('connect', () => {
            logger.info('Redis client connecting...');
        });

        this.client.on('ready', () => {
            logger.info('Redis client ready');
            this.isConnected = true;
        });

        this.client.on('error', (err) => {
            logger.error({ error: err.message }, 'Redis client error');
            this.isConnected = false;
        });

        this.client.on('end', () => {
            logger.info('Redis client connection ended');
            this.isConnected = false;
        });
    }

    async connect(): Promise<void> {
        try {
            await this.client.connect();
            logger.info('Redis connected successfully');
        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to connect to Redis');
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.client.quit();
            logger.info('Redis disconnected successfully');
        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to disconnect from Redis');
        }
    }

    getClient(): RedisClientType {
        return this.client;
    }

    isClientConnected(): boolean {
        return this.isConnected;
    }

    async storeOpportunity(opportunity: any): Promise<void> {
        try {
            const key = `opportunity:${opportunity.id}`;
            await this.client.setEx(key, 300, JSON.stringify(opportunity)); // Store for 5 minutes
            logger.debug('Stored opportunity in Redis', { id: opportunity.id });
        } catch (error) {
            logger.error('Failed to store opportunity in Redis', { error });
        }
    }

    async getOpportunity(id: string): Promise<any | null> {
        try {
            const key = `opportunity:${id}`;
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error('Failed to get opportunity from Redis', { id, error });
            return null;
        }
    }
}
