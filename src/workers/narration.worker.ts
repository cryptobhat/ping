/**
 * BullMQ worker for narration pipeline. Run: npm run worker:narration
 * Requires REDIS_URL, DATABASE_URL, and provider keys (GEMINI, SARVAM, R2 optional).
 */
import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config';
import { NARRATION_QUEUE_NAME, type NarrationStep } from '../queues/narration.queue';
import { runNarrationStep } from '../services/narration/narration-pipeline.service';

/** Dedicated connection for worker (separate from API Queue). */
const connection = new IORedis(config.redis.url, { maxRetriesPerRequest: null });
const concurrency = Math.max(1, parseInt(process.env.NARRATION_WORKER_CONCURRENCY || '2', 10));

const worker = new Worker(
  NARRATION_QUEUE_NAME,
  async (job) => {
    const { narrationJobId, step } = job.data as { narrationJobId: string; step: NarrationStep };
    console.log(`[narration-worker] job ${job.id} step=${step} narrationJobId=${narrationJobId}`);
    await runNarrationStep(narrationJobId, step);
  },
  { connection, concurrency }
);

worker.on('completed', (job) => {
  console.log(`[narration-worker] completed ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`[narration-worker] failed ${job?.id}`, err?.message);
});

console.log(`[narration-worker] listening on ${NARRATION_QUEUE_NAME} (concurrency=${concurrency})`);
