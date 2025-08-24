#!/usr/bin/env node

import { config } from 'dotenv';
import { logger } from './lib/logger';
import { ArbitrageEngine } from './lib/arbitrage-engine';
import { ExchangeManager } from './lib/exchange-manager';
import { DatabaseManager } from './lib/database-manager';
import { RedisManager } from './lib/redis-manager';
import { MetricsCollector } from './lib/metrics';
import { JobQueue } from './lib/job-queue';
import { HealthChecker } from './lib/health-checker';

// Load environment variables
config();

class ArbitrageWorker {
    private arbitrageEngine: ArbitrageEngine;
    private exchangeManager: ExchangeManager;
    private databaseManager: DatabaseManager;
    private redisManager: RedisManager;
    private metricsCollector: MetricsCollector;
    private jobQueue: JobQueue;
    private healthChecker: HealthChecker;
    private isShuttingDown = false;

    constructor() {
        this.initializeServices();
    }

    private async initializeServices(): Promise<void> {
        try {
            logger.info('Initializing CRYONEL Arbitrage Worker...');

            // Initialize Redis connection
            this.redisManager = new RedisManager();
            await this.redisManager.connect();

            // Initialize database connection
            this.databaseManager = new DatabaseManager();
            await this.databaseManager.connect();

            // Initialize exchange manager
            this.exchangeManager = new ExchangeManager();
            await this.exchangeManager.initialize();

            // Initialize job queue
            this.jobQueue = new JobQueue(this.redisManager);

            // Initialize metrics collector
            this.metricsCollector = new MetricsCollector();

            // Initialize arbitrage engine
            this.arbitrageEngine = new ArbitrageEngine(
                this.exchangeManager,
                this.databaseManager,
                this.redisManager,
                this.metricsCollector
            );

            // Initialize health checker
            this.healthChecker = new HealthChecker(
                this.redisManager,
                this.databaseManager,
                this.exchangeManager
            );

            logger.info('All services initialized successfully');

            // Start the worker
            await this.start();

        } catch (error) {
            logger.fatal({ error: error instanceof Error ? error.message : String(error) }, 'Failed to initialize worker');
            process.exit(1);
        }
    }

    private async start(): Promise<void> {
        try {
            logger.info('Starting arbitrage worker...');

            // Start health checker
            await this.healthChecker.start();

            // Start arbitrage engine
            await this.arbitrageEngine.start();

            // Start job queue processing
            await this.jobQueue.start();

            // Start metrics collection
            await this.metricsCollector.start();

            logger.info('Arbitrage worker started successfully');

            // Set up graceful shutdown
            this.setupGracefulShutdown();

            // Keep the process alive
            this.keepAlive();

        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to start worker');
            throw error;
        }
    }

    private async stop(): Promise<void> {
        if (this.isShuttingDown) return;

        this.isShuttingDown = true;
        logger.info('Stopping arbitrage worker...');

        try {
            // Stop arbitrage engine
            if (this.arbitrageEngine) {
                await this.arbitrageEngine.stop();
            }

            // Stop job queue
            if (this.jobQueue) {
                await this.jobQueue.stop();
            }

            // Stop metrics collector
            if (this.metricsCollector) {
                await this.metricsCollector.stop();
            }

            // Stop health checker
            if (this.healthChecker) {
                await this.healthChecker.stop();
            }

            // Close database connection
            if (this.databaseManager) {
                await this.databaseManager.disconnect();
            }

            // Close Redis connection
            if (this.redisManager) {
                await this.redisManager.disconnect();
            }

            logger.info('Arbitrage worker stopped successfully');

        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error during shutdown');
        }
    }

    private setupGracefulShutdown(): void {
        // Handle SIGTERM (Docker stop)
        process.on('SIGTERM', async () => {
            logger.info('Received SIGTERM, shutting down gracefully...');
            await this.stop();
            process.exit(0);
        });

        // Handle SIGINT (Ctrl+C)
        process.on('SIGINT', async () => {
            logger.info('Received SIGINT, shutting down gracefully...');
            await this.stop();
            process.exit(0);
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', async (error) => {
            logger.fatal({ error: error.message, stack: error.stack }, 'Uncaught exception');
            await this.stop();
            process.exit(1);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', async (reason, promise) => {
            logger.fatal({ reason, promise }, 'Unhandled promise rejection');
            await this.stop();
            process.exit(1);
        });
    }

    private keepAlive(): void {
        // Keep the process alive
        setInterval(() => {
            if (!this.isShuttingDown) {
                logger.debug('Worker heartbeat');
            }
        }, 30000); // 30 seconds
    }
}

// Start the worker if this file is run directly
if (require.main === module) {
    const worker = new ArbitrageWorker();
}

export default ArbitrageWorker;
