// apps/workers/copy-master/src/worker.ts
import { createClient, RedisClientType } from 'redis';
import { Queue, Worker, Job } from 'bullmq';
import pino from 'pino';

const logger = pino({ level: 'info' });

// Redis connection
const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Queue for copy trading signals
const copySignalsQueue = new Queue('copy-signals', {
  connection: redisClient as any
});

// Worker to process copy trading signals
const worker = new Worker('copy-signals', async (job: Job) => {
  const { signal } = job.data;

  logger.info('Processing copy trading signal', { signal });

  // TODO: Implement signal processing logic
  // 1. Validate signal
  // 2. Broadcast to followers
  // 3. Update signal status

  return { processed: true, signalId: signal.id };
}, {
  connection: redisClient as any
});

// Handle worker events
worker.on('completed', (job: Job) => {
  logger.info('Job completed', { jobId: job.id });
});

worker.on('failed', (job: Job | undefined, err: Error) => {
  logger.error('Job failed', { jobId: job?.id, error: err.message });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down copy master worker...');
  await worker.close();
  await redisClient.quit();
  process.exit(0);
});

logger.info('Copy master worker started');
