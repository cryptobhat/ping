import axios from 'axios';
import prisma from '../config/database';
import { isNarrationEligibleContentType } from '../utils/narration-eligibility';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs/promises';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';
const SARVAM_BASE_URL = 'https://api.sarvam.ai';

/** Sarvam BCP-47 language codes */
const LANG_MAP: Record<string, string> = {
  kn: 'kn-IN', hi: 'hi-IN', en: 'en-IN', ta: 'ta-IN', te: 'te-IN',
  mr: 'mr-IN', bn: 'bn-IN', gu: 'gu-IN', ml: 'ml-IN', pa: 'pa-IN', or: 'or-IN',
};

/** Content-type specific narration settings */
const NARRATION_STYLE: Record<string, { pace: number; speaker: string }> = {
  POEM:    { pace: 1.10, speaker: 'kabir' },     // Poetic, expressive male voice
  STORY:   { pace: 1.10, speaker: 'gokul' },     // Natural storytelling
  ARTICLE: { pace: 1.10, speaker: 'varun' },     // Clear, informative delivery
};

const CHUNK_SIZE = 450; // Sarvam API limit = 500 chars max per input

/** Get S3-compatible client (E2E Object Storage / R2 / any S3) */
function getStorageClient(): S3Client | null {
  const accessKeyId = (process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID)?.trim();
  const secretAccessKey = (process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY)?.trim();
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const bucket = (process.env.S3_BUCKET_NAME || process.env.R2_BUCKET_NAME)?.trim();
  if (!accessKeyId || !secretAccessKey || !bucket) return null;

  if (endpoint) {
    return new S3Client({
      region: process.env.S3_REGION?.trim() || 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }

  // Legacy R2 fallback
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  if (!accountId) return null;
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getPublicBase(): string | null {
  return (process.env.S3_PUBLIC_URL || process.env.R2_PUBLIC_URL)?.trim()?.replace(/\/+$/, '') || null;
}

/**
 * Split text into chunks at sentence boundaries.
 * Ensures each chunk ≤ CHUNK_SIZE chars and ends at a full sentence.
 */
function splitIntoChunks(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= CHUNK_SIZE) {
      chunks.push(remaining);
      break;
    }

    // Find the last sentence boundary within CHUNK_SIZE
    let splitAt = CHUNK_SIZE;
    const searchRegion = remaining.slice(0, CHUNK_SIZE);

    // Try splitting at sentence endings: . ! ? ।(Kannada/Hindi period)
    const sentenceEnd = Math.max(
      searchRegion.lastIndexOf('। '),
      searchRegion.lastIndexOf('. '),
      searchRegion.lastIndexOf('! '),
      searchRegion.lastIndexOf('? '),
      searchRegion.lastIndexOf('.\n'),
      searchRegion.lastIndexOf('।\n'),
    );

    if (sentenceEnd > CHUNK_SIZE * 0.5) {
      splitAt = sentenceEnd + 2; // Include the period and space
    } else {
      // Fallback: split at last newline or space
      const lastNewline = searchRegion.lastIndexOf('\n');
      const lastSpace = searchRegion.lastIndexOf(' ');
      splitAt = Math.max(lastNewline, lastSpace, CHUNK_SIZE * 0.7);
    }

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  return chunks.filter(c => c.length > 0);
}

/**
 * Pre-process text for better narration quality:
 * - Clean HTML/markdown artifacts
 * - Add natural pauses at paragraph breaks
 * - Preserve dialogue structure
 */
function preprocessForNarration(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')              // Strip HTML
    .replace(/\*\*([^*]+)\*\*/g, '$1')    // Strip bold markdown
    .replace(/\*([^*]+)\*/g, '$1')        // Strip italic markdown
    .replace(/#+ /g, '')                  // Strip heading markers
    .replace(/\n{3,}/g, '\n\n')           // Normalize multiple newlines
    .replace(/\n\n/g, '.\n\n')            // Add full stop at paragraph breaks for natural pause
    .replace(/([।.!?])\s*/g, '$1  ')      // Extra space after sentences = longer pauses
    .replace(/,\s*/g, ', ')               // Comma pause
    .replace(/[""]([^""]+)[""]|"([^"]+)"/g, '"$1$2"') // Normalize quotes
    .replace(/\.\./g, '.')                // Clean double periods from our additions
    .trim();
}

export class TtsService {
  /**
   * Generate audio for a single text chunk via Sarvam API.
   */
  static async generateChunkAudio(
    text: string,
    language: string,
    contentType: string = 'STORY',
  ): Promise<Buffer | null> {
    if (!SARVAM_API_KEY) {
      console.warn('[TTS] SARVAM_API_KEY not configured — skipping');
      return null;
    }

    const targetLang = LANG_MAP[language] || LANG_MAP.kn;
    const style = NARRATION_STYLE[contentType] || NARRATION_STYLE.STORY;

    try {
      const res = await axios.post(
        `${SARVAM_BASE_URL}/text-to-speech`,
        {
          inputs: [text],
          target_language_code: targetLang,
          speaker: style.speaker,
          model: 'bulbul:v3',
          pace: style.pace,
          enable_preprocessing: true,
        },
        {
          headers: {
            'API-Subscription-Key': SARVAM_API_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 120000, // 2 min for longer chunks
        },
      );

      const audioBase64 = res.data?.audios?.[0];
      if (!audioBase64) return null;
      return Buffer.from(audioBase64, 'base64');
    } catch (err: any) {
      console.error('[TTS] Sarvam error:', err.response?.status, JSON.stringify(err.response?.data || err.message));
      return null;
    }
  }

  /**
   * Generate full audio for long content by chunking + concatenating.
   * Uploads to R2/S3 if configured, else saves locally.
   * Returns the public URL of the audio file.
   */
  static async generateFullAudio(
    contentId: string,
    text: string,
    language: string,
    contentType: string = 'STORY',
  ): Promise<string | null> {
    const processed = preprocessForNarration(text);
    const chunks = splitIntoChunks(processed);

    console.log(`[TTS] Generating audio for ${contentId}: ${chunks.length} chunks, ${processed.length} chars, lang=${language}`);

    // Generate audio for each chunk sequentially (to maintain order)
    const audioBuffers: Buffer[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const buf = await this.generateChunkAudio(chunks[i], language, contentType);
      if (buf) {
        audioBuffers.push(buf);
        console.log(`[TTS] Chunk ${i + 1}/${chunks.length} done (${buf.length} bytes)`);
      } else {
        console.warn(`[TTS] Chunk ${i + 1}/${chunks.length} failed — skipping`);
      }
    }

    if (audioBuffers.length === 0) return null;

    // Concatenate all audio buffers
    const fullAudio = Buffer.concat(audioBuffers);
    const filename = `audio/${contentId}.wav`;

    // Try R2/S3 upload first
    const client = getStorageClient();
    const publicBase = getPublicBase();

    if (client && publicBase) {
      const bucket = (process.env.S3_BUCKET_NAME || process.env.R2_BUCKET_NAME)!.trim();
      try {
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: filename,
            Body: fullAudio,
            ContentType: 'audio/wav',
            CacheControl: 'public, max-age=31536000, immutable',
          }),
        );
        const url = `${publicBase}/${filename}`;
        console.log(`[TTS] Uploaded to R2: ${url}`);
        return url;
      } catch (err: any) {
        console.error('[TTS] R2 upload failed, falling back to local:', err.message);
      }
    }

    // Fallback: save locally
    const audioDir = path.join(process.cwd(), 'uploads', 'audio');
    await fs.mkdir(audioDir, { recursive: true });
    const localPath = path.join(audioDir, `${contentId}.wav`);
    await fs.writeFile(localPath, fullAudio);
    const url = `/uploads/audio/${contentId}.wav`;
    console.log(`[TTS] Saved locally: ${url}`);
    return url;
  }

  /**
   * Fire-and-forget: generate audio for published content and store the URL.
   * SKIPS if audio already exists (won't regenerate).
   */
  static async generateForContent(contentId: string): Promise<void> {
    try {
      const content = await prisma.content.findUnique({
        where: { id: contentId },
        select: { id: true, body: true, language: true, contentType: true, isDraft: true, audioUrl: true },
      });

      // Skip: draft, already has audio, wrong type (only STORY / series episodes), or no content
      if (!content || content.isDraft || content.audioUrl) return;
      if (!isNarrationEligibleContentType(content.contentType)) return;

      const plainText = content.body
        .replace(/<[^>]*>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (plainText.length < 50) return; // Too short

      const audioUrl = await this.generateFullAudio(
        content.id,
        plainText,
        content.language,
        content.contentType,
      );

      if (!audioUrl) return;

      await prisma.content.update({
        where: { id: contentId },
        data: { audioUrl },
      });

      console.log(`[TTS] ✅ Audio ready for content ${contentId}`);
    } catch (err: any) {
      console.error(`[TTS] ❌ Failed for content ${contentId}:`, err.message);
    }
  }
}
