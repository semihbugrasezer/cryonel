// Simple arbitrage worker for CRYONEL
import pino from 'pino';

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    base: { service: 'arbitrage-worker' }
});

logger.info('Arbitrage worker starting...');

// Simple heartbeat
setInterval(() => {
    logger.info('Arbitrage worker heartbeat');
}, 30000);

logger.info('Arbitrage worker started successfully');

// Keep the process running
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down');
    process.exit(0);
});