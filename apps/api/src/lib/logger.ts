import pino from "pino";
import { env } from "./env";

// Create the main logger instance
export const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: "cryonel-api",
    version: "1.0.0",
    environment: env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  transport: env.NODE_ENV === "development" ? {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  } : undefined,
});

// Create child loggers for different contexts
export const createChildLogger = (context: string, additionalFields?: Record<string, any>) => {
  return logger.child({ context, ...additionalFields });
};

// Request logger for HTTP requests
export const requestLogger = createChildLogger("http-request");

// Database logger
export const dbLogger = createChildLogger("database");

// Trading logger
export const tradingLogger = createChildLogger("trading");

// Auth logger
export const authLogger = createChildLogger("authentication");

// Worker logger
export const workerLogger = createChildLogger("worker");

// Metrics logger
export const metricsLogger = createChildLogger("metrics");

// Export logger types for use in other modules
export type Logger = typeof logger;
export type ChildLogger = ReturnType<typeof createChildLogger>;