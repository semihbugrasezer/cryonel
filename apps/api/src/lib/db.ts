// apps/api/src/lib/db.ts
import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import { env } from "./env";
import { dbLogger } from "./logger";

// Database connection pool configuration
const poolConfig = {
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
  ssl: env.POSTGRES_SSL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 10000, // Close idle clients after 10 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
};

// Create the connection pool
export const pool = new Pool(poolConfig);

// Export db as an alias for pool for backward compatibility
export const db = pool;

// Handle pool events
pool.on("connect", (client: PoolClient) => {
  dbLogger.info("New client connected to database");
});

pool.on("error", (err: Error, client: PoolClient) => {
  dbLogger.error({ err: err.message, stack: err.stack }, "Unexpected error on idle client");
});

pool.on("remove", (client: PoolClient) => {
  dbLogger.info("Client removed from pool");
});

// Graceful shutdown function
export const closePool = async (): Promise<void> => {
  dbLogger.info("Closing database pool...");
  await pool.end();
  dbLogger.info("Database pool closed");
};

// Helper function to execute queries with logging
export const executeQuery = async <T extends QueryResultRow = any>(
  query: string,
  params?: any[],
  client?: PoolClient
): Promise<QueryResult<T>> => {
  const startTime = Date.now();
  const queryId = Math.random().toString(36).substring(7);

  try {
    dbLogger.debug({ queryId, query, params }, "Executing database query");

    const result = client
      ? await client.query<T>(query, params)
      : await pool.query<T>(query, params);

    const duration = Date.now() - startTime;
    dbLogger.debug({ queryId, duration, rowCount: result.rowCount }, "Query completed successfully");

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    dbLogger.error({
      queryId,
      query,
      params,
      duration,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, "Database query failed");
    throw error;
  }
};

// Helper function to execute transactions
export const executeTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Health check function
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const result = await executeQuery("SELECT 1 as health_check");
    return result.rows[0]?.health_check === 1;
  } catch (error) {
    dbLogger.error({ error: error instanceof Error ? error.message : String(error) }, "Database health check failed");
    return false;
  }
};

// Export types
export type { Pool, PoolClient, QueryResult, QueryResultRow };
export type DatabaseRow = Record<string, any>;