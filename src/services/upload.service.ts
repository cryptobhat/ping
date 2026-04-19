import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

['images', 'covers', 'avatars'].forEach((dir) => {
  const fullPath = path.join(UPLOAD_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

let s3Client: S3Client | null | undefined;

function getS3Client(): S3Client | null {
  if (s3Client !== undefined) return s3Client;

  const accessKeyId = (process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID)?.trim();
  const secretAccessKey = (process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY)?.trim();
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const bucket = (process.env.S3_BUCKET_NAME || process.env.R2_BUCKET_NAME)?.trim();

  if (!accessKeyId || !secretAccessKey || !bucket) {
    // Fallback: try R2 legacy config
    const accountId = process.env.R2_ACCOUNT_ID?.trim();
    if (accountId && accessKeyId && secretAccessKey) {
      s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
      return s3Client;
    }
    s3Client = null;
    return s3Client;
  }

  s3Client = new S3Client({
    region: process.env.S3_REGION?.trim() || 'auto',
    endpoint: endpoint || undefined,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
  return s3Client;
}

function getPublicBase(): string | null {
  const raw = (process.env.S3_PUBLIC_URL || process.env.R2_PUBLIC_URL)?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, '');
}

const storage = multer.memoryStorage();

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only jpg, png, webp, gif images are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export class UploadService {
  static async processImage(
    buffer: Buffer,
    type: 'image' | 'cover' | 'avatar' = 'image'
  ): Promise<string> {
    const filename = `${uuid()}.webp`;
    const subDir = type === 'cover' ? 'covers' : type === 'avatar' ? 'avatars' : 'images';

    let pipeline = sharp(buffer);

    if (type === 'cover') {
      pipeline = pipeline.resize(1200, 630, { fit: 'cover' });
    } else if (type === 'avatar') {
      pipeline = pipeline.resize(400, 400, { fit: 'cover' });
    } else {
      pipeline = pipeline.resize(1080, null, { fit: 'inside', withoutEnlargement: true });
    }

    const webpBuffer = await pipeline.webp({ quality: 80 }).toBuffer();
    const key = `${subDir}/${filename}`;

    // Save locally (served via express.static /uploads/)
    const outputPath = path.join(UPLOAD_DIR, subDir, filename);
    await fs.promises.writeFile(outputPath, webpBuffer);
    const localUrl = `/uploads/${key}`;

    // Also upload to S3 for backup/CDN (non-blocking)
    const client = getS3Client();
    if (client) {
      const bucket = (process.env.S3_BUCKET_NAME || process.env.R2_BUCKET_NAME)?.trim();
      if (bucket) {
        client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: webpBuffer,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000, immutable',
          })
        ).catch(() => {}); // Non-blocking backup
      }
    }

    return localUrl;
  }
}
