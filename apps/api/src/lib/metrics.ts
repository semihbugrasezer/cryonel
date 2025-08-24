// apps/api/src/lib/metrics.ts
import client from "prom-client";
import { metricsLogger } from "./logger";

// Enable default metrics collection
client.collectDefaultMetrics({
  prefix: "cryonel_api_",
  labels: { service: "cryonel-api" },
});

// HTTP request metrics
export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

export const httpRequestSize = new client.Histogram({
  name: "http_request_size_bytes",
  help: "Size of HTTP requests in bytes",
  labelNames: ["method", "route"],
  buckets: [100, 1000, 5000, 10000, 50000, 100000],
});

export const httpResponseSize = new client.Histogram({
  name: "http_response_size_bytes",
  help: "Size of HTTP responses in bytes",
  labelNames: ["method", "route", "status_code"],
  buckets: [100, 1000, 5000, 10000, 50000, 100000],
});

// Database metrics
export const dbQueryDuration = new client.Histogram({
  name: "db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation", "table"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const dbConnectionsTotal = new client.Counter({
  name: "db_connections_total",
  help: "Total number of database connections",
  labelNames: ["status"],
});

export const dbConnectionsActive = new client.Gauge({
  name: "db_connections_active",
  help: "Number of active database connections",
});

// Redis metrics
export const redisOperationDuration = new client.Histogram({
  name: "redis_operation_duration_seconds",
  help: "Duration of Redis operations in seconds",
  labelNames: ["operation"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

export const redisOperationsTotal = new client.Counter({
  name: "redis_operations_total",
  help: "Total number of Redis operations",
  labelNames: ["operation", "status"],
});

// Trading metrics
export const tradingOrdersTotal = new client.Counter({
  name: "trading_orders_total",
  help: "Total number of trading orders",
  labelNames: ["venue", "side", "status"],
});

export const tradingOrderLatency = new client.Histogram({
  name: "trading_order_latency_seconds",
  help: "Latency of trading orders in seconds",
  labelNames: ["venue", "side"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
});

export const arbitrageOpportunitiesTotal = new client.Counter({
  name: "arbitrage_opportunities_total",
  help: "Total number of arbitrage opportunities",
  labelNames: ["base", "quote", "status"],
});

export const arbitrageProfitTotal = new client.Counter({
  name: "arbitrage_profit_total",
  help: "Total profit from arbitrage trades",
  labelNames: ["base", "quote"],
});

// Copy trading metrics
export const copyTradingSignalsTotal = new client.Counter({
  name: "copy_trading_signals_total",
  help: "Total number of copy trading signals",
  labelNames: ["master_id", "action", "status"],
});

export const copyTradingExecutionsTotal = new client.Counter({
  name: "copy_trading_executions_total",
  help: "Total number of copy trading executions",
  labelNames: ["master_id", "follower_id", "status"],
});

// Worker metrics
export const workerJobsTotal = new client.Counter({
  name: "worker_jobs_total",
  help: "Total number of worker jobs",
  labelNames: ["queue", "status"],
});

export const workerJobDuration = new client.Histogram({
  name: "worker_job_duration_seconds",
  help: "Duration of worker jobs in seconds",
  labelNames: ["queue"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
});

export const workerQueueSize = new client.Gauge({
  name: "worker_queue_size",
  help: "Current size of worker queues",
  labelNames: ["queue"],
});

// Business metrics
export const activeUsersTotal = new client.Gauge({
  name: "active_users_total",
  help: "Total number of active users",
  labelNames: ["subscription_tier"],
});

export const revenueTotal = new client.Counter({
  name: "revenue_total",
  help: "Total revenue in USD",
  labelNames: ["source", "subscription_tier"],
});

// Error metrics
export const errorsTotal = new client.Counter({
  name: "errors_total",
  help: "Total number of errors",
  labelNames: ["type", "service", "severity"],
});

// Custom metrics helper functions
export const recordHttpRequest = (
  method: string,
  route: string,
  statusCode: number,
  duration: number,
  requestSize?: number,
  responseSize?: number
) => {
  const labels = { method, route, status_code: statusCode.toString() };

  httpRequestDuration.observe(labels, duration);
  httpRequestsTotal.inc(labels);

  if (requestSize !== undefined) {
    httpRequestSize.observe({ method, route }, requestSize);
  }

  if (responseSize !== undefined) {
    httpResponseSize.observe(labels, responseSize);
  }
};

export const recordDbQuery = (operation: string, table: string, duration: number) => {
  dbQueryDuration.observe({ operation, table }, duration);
};

export const recordTradingOrder = (venue: string, side: string, status: string, latency?: number) => {
  tradingOrdersTotal.inc({ venue, side, status });

  if (latency !== undefined) {
    tradingOrderLatency.observe({ venue, side }, latency);
  }
};

export const recordArbitrageOpportunity = (base: string, quote: string, status: string, profit?: number) => {
  arbitrageOpportunitiesTotal.inc({ base, quote, status });

  if (profit !== undefined) {
    arbitrageProfitTotal.inc({ base, quote }, profit);
  }
};

export const recordWorkerJob = (queue: string, status: string, duration?: number) => {
  workerJobsTotal.inc({ queue, status });

  if (duration !== undefined) {
    workerJobDuration.observe({ queue }, duration);
  }
};

export const recordError = (type: string, service: string, severity: "low" | "medium" | "high") => {
  errorsTotal.inc({ type, service, severity });
};

// Metrics endpoint handler
export const getMetrics = async (): Promise<string> => {
  try {
    const metrics = await client.register.metrics();
    metricsLogger.debug("Metrics collected successfully");
    return metrics;
  } catch (error) {
    metricsLogger.error({ error: error instanceof Error ? error.message : String(error) }, "Failed to collect metrics");
    throw new Error("Failed to collect metrics");
  }
};

// Health check metrics
export const healthCheck = new client.Gauge({
  name: "health_check",
  help: "Health check status (1 = healthy, 0 = unhealthy)",
  labelNames: ["service"],
});

// Set initial health status
healthCheck.set({ service: "api" }, 1);

// Export the register for custom metrics
export { client };
export const register = client.register;

// Metrics handler for Express routes
export const metricsHandler = async (req: any, res: any): Promise<void> => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
};