import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { Pool } from 'pg';
import { createClient } from 'redis';
import { db } from '../lib/db';

const router: ExpressRouter = Router();

// Connection health check - Database, Redis, Exchange connections
router.get('/connection', async (_, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connections: {
      database: { status: 'unknown', latency: 0 },
      redis: { status: 'unknown', latency: 0 },
      exchanges: {
        binance: { status: 'unknown', latency: 0 },
        kraken: { status: 'unknown', latency: 0 },
        solana_rpc: { status: 'unknown', latency: 0 }
      }
    }
  };

  try {
    // Check database connection with latency
    const dbStart = Date.now();
    try {
      await db.query('SELECT 1');
      health.connections.database = {
        status: 'healthy',
        latency: Date.now() - dbStart
      };
    } catch (error) {
      health.connections.database = {
        status: 'unhealthy',
        latency: Date.now() - dbStart
      };
      health.status = 'degraded';
    }

    // Check Redis connection with latency
    const redisStart = Date.now();
    try {
      const redis = createClient({
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
      });
      await redis.connect();
      await redis.ping();
      await redis.quit();
      health.connections.redis = {
        status: 'healthy',
        latency: Date.now() - redisStart
      };
    } catch (error) {
      health.connections.redis = {
        status: 'unhealthy',
        latency: Date.now() - redisStart
      };
      health.status = 'degraded';
    }

    // Check exchange connections (simplified ping tests)
    try {
      // Binance API ping
      const binanceStart = Date.now();
      const binanceResponse = await fetch('https://api.binance.com/api/v3/ping', {
        method: 'GET',
        headers: { 'User-Agent': 'CRYONEL/1.0' }
      });
      health.connections.exchanges.binance = {
        status: binanceResponse.ok ? 'healthy' : 'unhealthy',
        latency: Date.now() - binanceStart
      };
    } catch (error) {
      health.connections.exchanges.binance = {
        status: 'unhealthy',
        latency: 0
      };
    }

    try {
      // Kraken API ping
      const krakenStart = Date.now();
      const krakenResponse = await fetch('https://api.kraken.com/0/public/Time', {
        method: 'GET',
        headers: { 'User-Agent': 'CRYONEL/1.0' }
      });
      health.connections.exchanges.kraken = {
        status: krakenResponse.ok ? 'healthy' : 'unhealthy',
        latency: Date.now() - krakenStart
      };
    } catch (error) {
      health.connections.exchanges.kraken = {
        status: 'unhealthy',
        latency: 0
      };
    }

    try {
      // Solana RPC ping
      const solanaStart = Date.now();
      const solanaRpc = process.env.SOLANA_RPC_PRIMARY || 'https://api.mainnet-beta.solana.com';
      const solanaResponse = await fetch(solanaRpc, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'CRYONEL/1.0'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getHealth'
        })
      });
      health.connections.exchanges.solana_rpc = {
        status: solanaResponse.ok ? 'healthy' : 'unhealthy',
        latency: Date.now() - solanaStart
      };
    } catch (error) {
      health.connections.exchanges.solana_rpc = {
        status: 'unhealthy',
        latency: 0
      };
    }

    // Determine overall status
    if (health.connections.database.status === 'unhealthy' || 
        health.connections.redis.status === 'unhealthy') {
      health.status = 'unhealthy';
    } else if (Object.values(health.connections.exchanges).some(ex => ex.status === 'unhealthy')) {
      health.status = 'degraded';
    }

    const statusCode = health.status === 'unhealthy' ? 503 : 200;
    return res.status(statusCode).json(health);

  } catch (error) {
    health.status = 'unhealthy';
    return res.status(503).json(health);
  }
});

// Health check endpoint
router.get('/healthz', async (_, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: 'healthy',
      database: 'unknown',
      redis: 'unknown'
    }
  };

  try {
    // Check database connection
    if (process.env.POSTGRES_HOST) {
      try {
        const pg = new Pool({
          host: process.env.POSTGRES_HOST,
          port: parseInt(process.env.POSTGRES_PORT || '5432'),
          user: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DB,
          connectionTimeoutMillis: 5000
        });

        await pg.query('SELECT 1');
        await pg.end();
        health.services.database = 'healthy';
      } catch (error) {
        health.services.database = 'unhealthy';
        health.status = 'degraded';
      }
    }

    // Check Redis connection
    if (process.env.REDIS_HOST) {
      try {
        const redis = createClient({
          url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
        });

        await redis.connect();
        await redis.ping();
        await redis.quit();
        health.services.redis = 'healthy';
      } catch (error) {
        health.services.redis = 'unhealthy';
        health.status = 'degraded';
      }
    }

    // Determine overall status
    if (health.services.database === 'unhealthy' || health.services.redis === 'unhealthy') {
      health.status = 'degraded';
    }

    return res.status(200).json(health);
  } catch (error) {
    health.status = 'unhealthy';
    return res.status(503).json(health);
  }
});

// Readiness check endpoint
router.get('/ready', async (_, res) => {
  const ready = {
    status: 'ready',
    timestamp: new Date().toISOString(),
    services: {
      api: 'ready',
      database: 'unknown',
      redis: 'unknown'
    }
  };

  try {
    // Check database connection
    if (process.env.POSTGRES_HOST) {
      try {
        const pg = new Pool({
          host: process.env.POSTGRES_HOST,
          port: parseInt(process.env.POSTGRES_PORT || '5432'),
          user: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DB,
          connectionTimeoutMillis: 5000
        });

        await pg.query('SELECT 1');
        await pg.end();
        ready.services.database = 'ready';
      } catch (error) {
        ready.services.database = 'not_ready';
        ready.status = 'not_ready';
      }
    }

    // Check Redis connection
    if (process.env.REDIS_HOST) {
      try {
        const redis = createClient({
          url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
        });

        await redis.connect();
        await redis.ping();
        await redis.quit();
        ready.services.redis = 'ready';
      } catch (error) {
        ready.services.redis = 'not_ready';
        ready.status = 'not_ready';
      }
    }

    // Determine overall status
    if (ready.services.database === 'not_ready' || ready.services.redis === 'not_ready') {
      ready.status = 'not_ready';
    }

    return res.status(200).json(ready);
  } catch (error) {
    ready.status = 'not_ready';
    return res.status(503).json(ready);
  }
});

export default router;
