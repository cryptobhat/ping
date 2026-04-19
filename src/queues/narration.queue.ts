import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config';

export type NarrationStep = 'preprocess' | 'tts' | 'compose';

export const NARRATION_QUEUE_NAME = 'narration-pipeline';

let queue: Queue | null = null;
let connection: IORedis | null = null;

function getConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(config.redis.url, { maxRetriesPerRequest: null });
  }
  return connection;
}

function getQueue(): Queue {
  if (!queue) {
    queue = new Queue(NARRATION_QUEUE_NAME, { connection: getConnection() });
  }
  return queue;
}

export async function enqueueNarrationStep(narrationJobId: string, step: NarrationStep): Promise<void> {
  const q = getQueue();
  await q.add(
    'step',
    { narrationJobId, step },
    {
      removeOnComplete: 200,
      removeOnFail: 100,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    }
  );
}
