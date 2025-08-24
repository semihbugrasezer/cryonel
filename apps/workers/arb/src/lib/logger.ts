import pino from 'pino';
import { config } from '../config';

// Create the main logger instance
export const logger = pino({
    level: config.LOG_LEVEL || 'info',
    base: {
        service: 'cryonel-arbitrage-worker',
        version: '1.0.0',
        environment: config.NODE_ENV || 'development',
        region: config.REGION || 'eu',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
    transport: config.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    } : undefined,
});

// Create child loggers for different contexts
export const createChildLogger = (context: string, additionalFields?: Record<string, any>) => {
    return logger.child({ context, ...additionalFields });
};

// Request logger for HTTP requests
export const requestLogger = createChildLogger('request');

// Database logger
export const dbLogger = createChildLogger('database');

// Redis logger
export const redisLogger = createChildLogger('redis');

// Exchange logger
export const exchangeLogger = createChildLogger('exchange');

// Arbitrage logger
export const arbitrageLogger = createChildLogger('arbitrage');

// Trade execution logger
export const tradeLogger = createChildLogger('trade');

// Metrics logger
export const metricsLogger = createChildLogger('metrics');

// Health check logger
export const healthLogger = createChildLogger('health');

// Job queue logger
export const queueLogger = createChildLogger('queue');

// Configuration logger
export const configLogger = createChildLogger('config');

// Error logger with additional context
export const errorLogger = (error: Error, context?: Record<string, any>) => {
    const errorContext = {
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
        },
        ...context,
    };

    logger.error(errorContext, 'Error occurred');
};

// Performance logger for timing operations
export const performanceLogger = (operation: string, duration: number, context?: Record<string, any>) => {
    logger.info({
        operation,
        duration,
        ...context,
    }, 'Operation completed');
};

// Audit logger for important business events
export const auditLogger = (event: string, data: Record<string, any>, userId?: string) => {
    logger.info({
        event,
        userId,
        ...data,
    }, 'Audit event');
};

// Security logger for security-related events
export const securityLogger = (event: string, data: Record<string, any>, severity: 'low' | 'medium' | 'high' = 'medium') => {
    logger.warn({
        event,
        severity,
        ...data,
    }, 'Security event');
};

// Export the main logger as default
export default logger;
