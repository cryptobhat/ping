import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import prisma from '../../config/database';
import {
  NarrationJobStage,
  NarrationJobStatus,
  NarrationSegmentTtsStatus,
  NarrationAudioAssetKind,
  NarrationSegmentRole,
} from '@prisma/client';
import { GeminiPreprocessService } from './gemini-preprocess.service';
import { SarvamNarrationAdapter } from './sarvam-adapter';
import {
  getObjectStorage,
  NarrationStorageAdapter,
  narrationSegmentKey,
  narrationFinalKey,
  putLocalNarration,
} from './storage-adapter';
import { FfmpegNarrationService } from './ffmpeg.service';
import { enqueueNarrationStep, type NarrationStep } from '../../queues/narration.queue';

const TTS_CONCURRENCY = Math.max(1, parseInt(process.env.NARRATION_TTS_CONCURRENCY || '2', 10));
const DELIVERY_KBPS = (parseInt(process.env.NARRATION_DELIVERY_BITRATE_KBPS || '64', 10) === 128 ? 128 : 64) as 64 | 128;

async function logJob(
  jobId: string,
  stage: string,
  message: string,
  level: 'info' | 'warn' | 'error' = 'info',
  meta?: Record<string, unknown>
): Promise<void> {
  await prisma.narrationJobLog.create({
    data: {
      jobId,
      stage,
      level,
      message,
      meta: meta ? (meta as object) : undefined,
    },
  });
}

function mergeTiming(
  existing: Record<string, number>,
  key: string,
  ms: number
): Record<string, number> {
  return { ...existing, [key]: ms };
}

async function getStageTimings(jobId: string): Promise<Record<string, number>> {
  const j = await prisma.narrationJob.findUnique({
    where: { id: jobId },
    select: { stageTimingsMs: true },
  });
  return (j?.stageTimingsMs as Record<string, number>) || {};
}

export async function runNarrationStep(narrationJobId: string, step: NarrationStep): Promise<void> {
  const job = await prisma.narrationJob.findUnique({
    where: { id: narrationJobId },
    include: {
      chapter: { include: { story: true } },
      segments: { orderBy: { segmentIndex: 'asc' } },
    },
  });

  if (!job) {
    throw new Error(`Narration job not found: ${narrationJobId}`);
  }

  if (job.status === NarrationJobStatus.CANCELLED) {
    return;
  }

  await prisma.narrationJob.update({
    where: { id: narrationJobId },
    data: { status: NarrationJobStatus.RUNNING, startedAt: job.startedAt ?? new Date() },
  });

  try {
    if (step === 'preprocess') {
      await runPreprocess(job);
      await enqueueNarrationStep(narrationJobId, 'tts');
    } else if (step === 'tts') {
      await runTts(job);
      await enqueueNarrationStep(narrationJobId, 'compose');
    } else {
      await runCompose(job);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const errorStage =
      step === 'preprocess'
        ? NarrationJobStage.GEMINI_PREPROCESS
        : step === 'tts'
          ? NarrationJobStage.TTS_SEGMENTS
          : NarrationJobStage.FFMPEG_COMPOSE;
    await prisma.narrationJob.update({
      where: { id: narrationJobId },
      data: {
        status: NarrationJobStatus.FAILED,
        errorMessage: msg,
        errorStage,
      },
    });
    await logJob(narrationJobId, step, msg, 'error', { stack: e instanceof Error ? e.stack : undefined });
    throw e;
  }
}

async function runPreprocess(job: {
  id: string;
  geminiJson: unknown;
  stageTimingsMs: unknown;
  segments: { length: number };
  chapter: {
    id: string;
    storyId: string;
    rawText: string;
    story: {
      id: string;
      narratorGenderPref: string;
      bgmDefaultEnabled: boolean;
      sfxDefaultEnabled: boolean;
    };
  };
}): Promise<void> {
  const t0 = Date.now();
  await prisma.narrationJob.update({
    where: { id: job.id },
    data: { currentStage: NarrationJobStage.GEMINI_PREPROCESS },
  });
  await logJob(job.id, 'GEMINI_PREPROCESS', 'Starting Gemini preprocessing');

  if (job.segments.length > 0 && job.geminiJson) {
    await logJob(job.id, 'GEMINI_PREPROCESS', 'Skipped — segments already exist');
    const timings = mergeTiming(await getStageTimings(job.id), 'GEMINI_PREPROCESS', Date.now() - t0);
    await prisma.narrationJob.update({
      where: { id: job.id },
      data: { stageTimingsMs: timings, currentStage: NarrationJobStage.TTS_SEGMENTS },
    });
    return;
  }

  const out = await GeminiPreprocessService.preprocessStoryText(job.chapter.rawText, {
    dialect: 'general',
  });

  const geminiElapsed = Date.now() - t0;
  const timingsBase = await getStageTimings(job.id);

  await prisma.$transaction(async (tx) => {
    await tx.narrationSegment.deleteMany({ where: { jobId: job.id } });
    for (const seg of out.segments) {
      const idem = createHash('sha256')
        .update(`${job.id}:${seg.segment_id}:${seg.normalized_tts_text}`)
        .digest('hex')
        .slice(0, 48);
      await tx.narrationSegment.create({
        data: {
          jobId: job.id,
          segmentIndex: seg.segment_id,
          role: seg.role as NarrationSegmentRole,
          speaker: seg.speaker,
          emotion: seg.emotion,
          pauseAfterMs: seg.pause_after_ms,
          speed: seg.speed,
          bgmTag: seg.bgm_tag,
          sfxTag: seg.sfx_tag,
          originalText: seg.original_text,
          normalizedTtsText: seg.normalized_tts_text,
          idempotencyKey: idem,
        },
      });
    }
    const timings = mergeTiming(timingsBase, 'GEMINI_PREPROCESS', geminiElapsed);
    await tx.narrationJob.update({
      where: { id: job.id },
      data: {
        geminiJson: out as object,
        stageTimingsMs: timings,
        currentStage: NarrationJobStage.TTS_SEGMENTS,
      },
    });
  });

  await logJob(job.id, 'GEMINI_PREPROCESS', `Created ${out.segments.length} segments`);
}

async function runTts(job: { id: string; stageTimingsMs: unknown; chapter: { id: string; story: { id: string; narratorGenderPref: string } } }): Promise<void> {
  const t0 = Date.now();
  await prisma.narrationJob.update({
    where: { id: job.id },
    data: { currentStage: NarrationJobStage.TTS_SEGMENTS },
  });

  const storageCfg = getObjectStorage();
  const adapter = storageCfg ? new NarrationStorageAdapter(storageCfg) : null;
  const storyId = job.chapter.story.id;
  const chapterId = job.chapter.id;

  const segments = await prisma.narrationSegment.findMany({
    where: { jobId: job.id },
    orderBy: { segmentIndex: 'asc' },
  });

  const genderPref = job.chapter.story.narratorGenderPref;

  async function processOne(seg: (typeof segments)[0]): Promise<void> {
    if (seg.ttsStatus === NarrationSegmentTtsStatus.COMPLETED && seg.audioAssetId) {
      return;
    }

    try {
    await prisma.narrationSegment.update({
      where: { id: seg.id },
      data: { ttsStatus: NarrationSegmentTtsStatus.PROCESSING },
    });

    const key = narrationSegmentKey(storyId, chapterId, job.id, seg.segmentIndex, 'wav');

    if (adapter) {
      const exists = await adapter.head(key);
      if (exists && seg.audioAssetId) {
        await prisma.narrationSegment.update({
          where: { id: seg.id },
          data: { ttsStatus: NarrationSegmentTtsStatus.COMPLETED },
        });
        return;
      }
    }

    const buf = await SarvamNarrationAdapter.synthesizeSegment({
      text: seg.normalizedTtsText,
      language: 'kn',
      role: seg.role,
      narratorGenderPref: genderPref === 'female' || genderPref === 'male' ? genderPref : 'male',
      pace: seg.speed,
    });

    const checksum = createHash('sha256').update(buf).digest('hex');

    let durationMs = 0;
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'narr-tts-'));
    const tmpWav = path.join(tmpDir, 'seg.wav');
    try {
      await fs.writeFile(tmpWav, buf);
      const sec = await FfmpegNarrationService.probeDurationSec(tmpWav);
      durationMs = Math.round(sec * 1000);
    } catch {
      durationMs = 0;
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }

    if (adapter) {
      await adapter.put(key, buf, 'audio/wav', 'public, max-age=31536000, immutable');
      const asset = await prisma.narrationAudioAsset.create({
        data: {
          jobId: job.id,
          kind: NarrationAudioAssetKind.SEGMENT_RAW,
          storageKey: key,
          format: 'wav',
          durationMs,
          checksum,
          provider: 'sarvam',
        },
      });
      await prisma.narrationSegment.update({
        where: { id: seg.id },
        data: {
          ttsStatus: NarrationSegmentTtsStatus.COMPLETED,
          audioAssetId: asset.id,
          durationMs,
          ttsErrorMessage: null,
        },
      });
    } else {
      const publicPath = await putLocalNarration(key, buf);
      const asset = await prisma.narrationAudioAsset.create({
        data: {
          jobId: job.id,
          kind: NarrationAudioAssetKind.SEGMENT_RAW,
          storageKey: publicPath,
          format: 'wav',
          durationMs,
          checksum,
          provider: 'sarvam',
        },
      });
      await prisma.narrationSegment.update({
        where: { id: seg.id },
        data: {
          ttsStatus: NarrationSegmentTtsStatus.COMPLETED,
          audioAssetId: asset.id,
          durationMs,
        },
      });
    }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await prisma.narrationSegment.update({
        where: { id: seg.id },
        data: {
          ttsStatus: NarrationSegmentTtsStatus.FAILED,
          ttsRetryCount: { increment: 1 },
          ttsErrorMessage: msg,
        },
      });
      throw e;
    }
  }

  const pending = segments.filter((s) => s.ttsStatus !== NarrationSegmentTtsStatus.COMPLETED || !s.audioAssetId);
  for (let i = 0; i < pending.length; i += TTS_CONCURRENCY) {
    const batch = pending.slice(i, i + TTS_CONCURRENCY);
    const results = await Promise.allSettled(batch.map((seg) => processOne(seg)));
    const rejected = results.filter((r) => r.status === 'rejected');
    if (rejected.length > 0) {
      const first = rejected[0] as PromiseRejectedResult;
      throw first.reason;
    }
  }

  const failed = await prisma.narrationSegment.count({
    where: { jobId: job.id, ttsStatus: NarrationSegmentTtsStatus.FAILED },
  });
  if (failed > 0) {
    throw new Error(`${failed} segment(s) failed TTS`);
  }

  const timings = mergeTiming(await getStageTimings(job.id), 'TTS_SEGMENTS', Date.now() - t0);
  await prisma.narrationJob.update({
    where: { id: job.id },
    data: { stageTimingsMs: timings, currentStage: NarrationJobStage.FFMPEG_COMPOSE },
  });
  await logJob(job.id, 'TTS_SEGMENTS', 'TTS completed for all segments');
}

async function runCompose(job: { id: string; stageTimingsMs: unknown; chapter: { id: string; story: { id: string; bgmDefaultEnabled: boolean } } }): Promise<void> {
  const t0 = Date.now();
  await prisma.narrationJob.update({
    where: { id: job.id },
    data: { currentStage: NarrationJobStage.FFMPEG_COMPOSE },
  });

  const storageCfg = getObjectStorage();
  const adapter = storageCfg ? new NarrationStorageAdapter(storageCfg) : null;
  const storyId = job.chapter.story.id;
  const chapterId = job.chapter.id;

  const segments = await prisma.narrationSegment.findMany({
    where: { jobId: job.id },
    orderBy: { segmentIndex: 'asc' },
    include: { audioAsset: true },
  });

  if (segments.some((s) => !s.audioAsset)) {
    throw new Error('Missing segment audio assets');
  }

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'narr-compose-'));
  const concatParts: string[] = [];

  try {
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const asset = seg.audioAsset!;
      const localSeg = path.join(workDir, `seg_${String(seg.segmentIndex).padStart(4, '0')}.wav`);
      if (adapter && !asset.storageKey.startsWith('/uploads/')) {
        await adapter.downloadToFile(asset.storageKey, localSeg);
      } else if (asset.storageKey.startsWith('/uploads/')) {
        const diskPath = path.join(process.cwd(), asset.storageKey.replace(/^\//, ''));
        await fs.copyFile(diskPath, localSeg);
      } else {
        throw new Error(`Cannot resolve segment file: ${asset.storageKey}`);
      }

      const mp3Seg = path.join(workDir, `seg_${String(seg.segmentIndex).padStart(4, '0')}.mp3`);
      await FfmpegNarrationService.toMp3(localSeg, mp3Seg, '192k');
      concatParts.push(mp3Seg);

      const pauseMs = seg.pauseAfterMs;
      if (pauseMs > 0 && i < segments.length - 1) {
        const silencePath = path.join(workDir, `silence_${i}.wav`);
        await FfmpegNarrationService.generateSilenceWav(pauseMs / 1000, silencePath);
        const silenceMp3 = path.join(workDir, `silence_${i}.mp3`);
        await FfmpegNarrationService.toMp3(silencePath, silenceMp3, '192k');
        concatParts.push(silenceMp3);
      }
    }

    const listFile = path.join(workDir, 'concat.txt');
    const toPosix = (p: string) => p.replace(/\\/g, '/');
    const listBody = concatParts.map((p) => `file '${toPosix(p).replace(/'/g, "'\\''")}'`).join('\n');
    await fs.writeFile(listFile, listBody, 'utf8');

    const rawConcat = path.join(workDir, 'concat_out.mp3');
    await FfmpegNarrationService.concatListFile(listFile, rawConcat, true);

    const masterLocal = path.join(workDir, 'master.mp3');
    await FfmpegNarrationService.loudnormMp3(rawConcat, masterLocal);

    let finalVoiceMaster = masterLocal;
    const firstBgm = segments.find((s) => s.bgmTag !== 'none')?.bgmTag;
    if (job.chapter.story.bgmDefaultEnabled && firstBgm && firstBgm !== 'none') {
      const bgmRow = await prisma.narrationBgmAsset.findUnique({ where: { tag: firstBgm } });
      if (bgmRow && adapter) {
        const bgmLocal = path.join(workDir, 'bgm.mp3');
        await adapter.downloadToFile(bgmRow.storageKey, bgmLocal);
        const mixed = path.join(workDir, 'master_mixed.mp3');
        const vol = Math.pow(10, (bgmRow.defaultGainDb ?? -18) / 20);
        await FfmpegNarrationService.mixWithBgm(masterLocal, bgmLocal, mixed, Math.min(0.25, vol));
        finalVoiceMaster = mixed;
      }
    }

    const deliveryLocal = path.join(workDir, `delivery_${DELIVERY_KBPS}k.mp3`);
    await FfmpegNarrationService.transcodeMp3Bitrate(finalVoiceMaster, deliveryLocal, DELIVERY_KBPS);

    const masterKey = narrationFinalKey(storyId, chapterId, job.id, 'master');
    const deliveryKey = narrationFinalKey(
      storyId,
      chapterId,
      job.id,
      DELIVERY_KBPS === 64 ? 'delivery_64k' : 'delivery_128'
    );

    const masterBuf = await fs.readFile(finalVoiceMaster);
    const deliveryBuf = await fs.readFile(deliveryLocal);
    const masterChecksum = createHash('sha256').update(masterBuf).digest('hex');
    const deliveryChecksum = createHash('sha256').update(deliveryBuf).digest('hex');
    const masterDur = await FfmpegNarrationService.probeDurationSec(finalVoiceMaster);
    const deliveryDur = await FfmpegNarrationService.probeDurationSec(deliveryLocal);

    let masterAssetId: string;
    let deliveryAssetId: string;

    if (adapter) {
      await adapter.put(masterKey, masterBuf, 'audio/mpeg', 'public, max-age=31536000, immutable');
      await adapter.put(deliveryKey, deliveryBuf, 'audio/mpeg', 'public, max-age=31536000, immutable');

      const masterAsset = await prisma.narrationAudioAsset.create({
        data: {
          jobId: job.id,
          kind: NarrationAudioAssetKind.CHAPTER_MASTER,
          storageKey: masterKey,
          format: 'mp3',
          bitrate: 192,
          durationMs: Math.round(masterDur * 1000),
          checksum: masterChecksum,
          provider: 'ffmpeg',
        },
      });
      const deliveryAsset = await prisma.narrationAudioAsset.create({
        data: {
          jobId: job.id,
          kind: NarrationAudioAssetKind.CHAPTER_DELIVERY,
          storageKey: deliveryKey,
          format: 'mp3',
          bitrate: DELIVERY_KBPS,
          durationMs: Math.round(deliveryDur * 1000),
          checksum: deliveryChecksum,
          provider: 'ffmpeg',
        },
      });
      masterAssetId = masterAsset.id;
      deliveryAssetId = deliveryAsset.id;
    } else {
      const mPath = await putLocalNarration(masterKey, masterBuf);
      const dPath = await putLocalNarration(deliveryKey, deliveryBuf);
      const masterAsset = await prisma.narrationAudioAsset.create({
        data: {
          jobId: job.id,
          kind: NarrationAudioAssetKind.CHAPTER_MASTER,
          storageKey: mPath,
          format: 'mp3',
          bitrate: 192,
          durationMs: Math.round(masterDur * 1000),
          checksum: masterChecksum,
          provider: 'ffmpeg',
        },
      });
      const deliveryAsset = await prisma.narrationAudioAsset.create({
        data: {
          jobId: job.id,
          kind: NarrationAudioAssetKind.CHAPTER_DELIVERY,
          storageKey: dPath,
          format: 'mp3',
          bitrate: DELIVERY_KBPS,
          durationMs: Math.round(deliveryDur * 1000),
          checksum: deliveryChecksum,
          provider: 'ffmpeg',
        },
      });
      masterAssetId = masterAsset.id;
      deliveryAssetId = deliveryAsset.id;
    }

    const timings = mergeTiming(await getStageTimings(job.id), 'FFMPEG_COMPOSE', Date.now() - t0);

    await prisma.narrationJob.update({
      where: { id: job.id },
      data: {
        status: NarrationJobStatus.COMPLETED,
        currentStage: NarrationJobStage.DONE,
        masterAssetId,
        deliveryAssetId,
        stageTimingsMs: timings,
        finishedAt: new Date(),
        waveformMeta: {
          sampleRate: 24000,
          channels: 1,
          deliveryBitrateKbps: DELIVERY_KBPS,
        } as object,
      },
    });

    await logJob(job.id, 'compose', 'Chapter master and delivery assets ready');
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
