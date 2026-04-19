import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import fs from 'fs/promises';
import path from 'path';

export type ObjectStorageConfig = {
  client: S3Client;
  bucket: string;
  publicBaseUrl: string | null;
};

function buildClient(): ObjectStorageConfig | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const region = process.env.S3_REGION?.trim() || process.env.AWS_REGION?.trim() || 'auto';
  const endpoint =
    process.env.S3_ENDPOINT?.trim() ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '');
  const publicBase = process.env.R2_PUBLIC_URL?.trim()?.replace(/\/+$/, '') || null;

  if (endpoint && accessKeyId && secretAccessKey && bucket) {
    return {
      client: new S3Client({
        region,
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === '1',
      }),
      bucket,
      publicBaseUrl: publicBase,
    };
  }

  const awsBucket = process.env.AWS_S3_BUCKET?.trim();
  if (awsBucket && accessKeyId && secretAccessKey) {
    return {
      client: new S3Client({
        region: region === 'auto' ? 'ap-south-1' : region,
        credentials: { accessKeyId, secretAccessKey },
      }),
      bucket: awsBucket,
      publicBaseUrl: process.env.AWS_S3_PUBLIC_BASE_URL?.trim() || null,
    };
  }

  return null;
}

let cached: ObjectStorageConfig | null | undefined;

export function getObjectStorage(): ObjectStorageConfig | null {
  if (cached !== undefined) return cached;
  cached = buildClient();
  return cached;
}

export function narrationSegmentKey(storyId: string, chapterId: string, jobId: string, segmentIndex: number, ext: string): string {
  return `stories/${storyId}/chapters/${chapterId}/jobs/${jobId}/segments/${String(segmentIndex).padStart(4, '0')}.${ext}`;
}

export function narrationFinalKey(
  storyId: string,
  chapterId: string,
  jobId: string,
  name: 'master' | 'delivery_64k' | 'delivery_128'
): string {
  const suffix = name === 'master' ? 'master.mp3' : name === 'delivery_64k' ? 'delivery_64k.mp3' : 'delivery_128.mp3';
  return `stories/${storyId}/chapters/${chapterId}/jobs/${jobId}/final/${suffix}`;
}

export class NarrationStorageAdapter {
  constructor(private readonly cfg: ObjectStorageConfig) {}

  async put(
    key: string,
    body: Buffer | Uint8Array,
    contentType: string,
    cacheControl?: string
  ): Promise<void> {
    const input: PutObjectCommandInput = {
      Bucket: this.cfg.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    };
    if (cacheControl) input.CacheControl = cacheControl;
    await this.cfg.client.send(new PutObjectCommand(input));
  }

  async head(key: string): Promise<{ contentLength?: number } | null> {
    try {
      const out = await this.cfg.client.send(
        new HeadObjectCommand({ Bucket: this.cfg.bucket, Key: key })
      );
      return { contentLength: out.ContentLength };
    } catch {
      return null;
    }
  }

  async presignGet(key: string, expiresSec = 3600): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: this.cfg.bucket, Key: key });
    return getSignedUrl(this.cfg.client, cmd, { expiresIn: expiresSec });
  }

  /** Public URL when bucket is public (R2 custom domain); else use presignGet. */
  getPublicUrl(key: string): string | null {
    if (!this.cfg.publicBaseUrl) return null;
    return `${this.cfg.publicBaseUrl}/${key}`;
  }

  async downloadToFile(key: string, destPath: string): Promise<void> {
    const out = await this.cfg.client.send(
      new GetObjectCommand({ Bucket: this.cfg.bucket, Key: key })
    );
    if (!out.Body) throw new Error('Empty object body');
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    const ws = createWriteStream(destPath);
    await pipeline(out.Body as NodeJS.ReadableStream, ws);
  }
}

export const LOCAL_NARRATION_ROOT = path.join(process.cwd(), 'uploads', 'narration');

export async function putLocalNarration(key: string, body: Buffer): Promise<string> {
  const full = path.join(LOCAL_NARRATION_ROOT, key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, body);
  return `/uploads/narration/${key.replace(/\\/g, '/')}`;
}
