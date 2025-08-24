// apps/api/src/server.ts
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { createServer } from "http";
import passport from "./lib/passport";
import { config } from "./lib/config";
import { logger } from "./lib/logger";
import { connectRedis, closeRedis } from "./lib/redis";
import { closePool } from "./lib/db";
import { getMetrics } from "./lib/metrics";
import { initializeWebSocketServer } from "./lib/websocket";
import routes from "./routes";

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development, configure properly for production
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: config.APP_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Initialize Passport
app.use(passport.initialize());

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  // Add request ID to response headers
  res.setHeader("X-Request-ID", requestId);

  // Log request
  logger.info({
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
  }, "Incoming request");

  // Log response
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.info({
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
    }, "Request completed");
  });

  next();
});

// Health check endpoint
app.get("/healthz", async (req, res) => {
  try {
    // Check database health
    const { checkDatabaseHealth } = await import("./lib/db");
    const dbHealthy = await checkDatabaseHealth();

    // Check Redis health
    const { checkRedisHealth } = await import("./lib/redis");
    const redisHealthy = await checkRedisHealth();

    const healthy = dbHealthy && redisHealthy;
    const statusCode = healthy ? 200 : 503;

    res.status(statusCode).json({
      status: healthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? "healthy" : "unhealthy",
        redis: redisHealthy ? "healthy" : "unhealthy",
      },
      uptime: process.uptime(),
      version: "1.0.0",
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Health check failed");
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
    });
  }
});

// Metrics endpoint (protected in production)
app.get("/metrics", async (req, res) => {
  try {
    const metrics = await getMetrics();
    res.set("Content-Type", "text/plain");
    res.send(metrics);
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Failed to get metrics");
    res.status(500).json({ error: "Failed to get metrics" });
  }
});

// API routes
app.use("/api", routes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Endpoint not found",
    },
    requestId: res.getHeader("X-Request-ID"),
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const requestId = res.getHeader("X-Request-ID");

  logger.error({
    requestId,
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  }, "Unhandled error");

  // Don't expose internal errors in production
  const isDevelopment = config.NODE_ENV === "development";
  const errorMessage = isDevelopment ? error.message : "Internal server error";
  const errorStack = isDevelopment ? error.stack : undefined;

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: errorMessage,
      ...(errorStack && { stack: errorStack }),
    },
    requestId,
  });
});

// Global server reference
let server: any;
let wsServer: any;

// Graceful shutdown function
const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, "Received shutdown signal");

  try {
    // Close HTTP server
    if (server) {
      server.close(() => {
        logger.info("HTTP server closed");
      });
    }

    // Close database connections
    await closePool();
    logger.info("Database connections closed");

    // Close Redis connections
    await closeRedis();
    logger.info("Redis connections closed");

    logger.info("Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, "Error during graceful shutdown");
    process.exit(1);
  }
};

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.fatal({ error: error.message, stack: error.stack }, "Uncaught exception");
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.fatal({ reason, promise }, "Unhandled promise rejection");
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Connect to Redis
    await connectRedis();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize WebSocket server
    wsServer = initializeWebSocketServer(httpServer);

    // Start HTTP server
    server = httpServer.listen(config.PORT, () => {
      logger.info({
        port: config.PORT,
        environment: config.NODE_ENV,
        region: config.REGION,
        websocket: true,
      }, "CRYONEL API server started with WebSocket support");
    });

  } catch (error) {
    logger.fatal({ error: error instanceof Error ? error.message : String(error) }, "Failed to start server");
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;