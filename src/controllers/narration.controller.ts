import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';
import { enqueueNarrationStep } from '../queues/narration.queue';
import {
  NarrationJobStatus,
  NarrationJobStage,
  NarrationSegmentTtsStatus,
} from '@prisma/client';
import { SarvamNarrationAdapter } from '../services/narration/sarvam-adapter';
import { getObjectStorage, NarrationStorageAdapter } from '../services/narration/storage-adapter';
import { isNarrationEligibleContentType } from '../utils/narration-eligibility';

async function assertStoryOwner(storyId: string, userId: string) {
  const story = await prisma.narrationStory.findFirst({
    where: { id: storyId, ownerId: userId },
  });
  return story;
}

async function assertChapterAccess(chapterId: string, userId: string) {
  const chapter = await prisma.narrationChapter.findFirst({
    where: { id: chapterId, story: { ownerId: userId } },
    include: { story: true },
  });
  return chapter;
}

export const createStory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { title, genre, narratorGenderPref, dialectColloquial, bgmDefaultEnabled, sfxDefaultEnabled } = req.body;
    if (!title || typeof title !== 'string') {
      errorResponse(res, 'title is required', 400);
      return;
    }
    const story = await prisma.narrationStory.create({
      data: {
        ownerId: userId,
        title: title.trim(),
        genre: genre?.trim() || null,
        narratorGenderPref: ['male', 'female', 'any'].includes(narratorGenderPref) ? narratorGenderPref : 'any',
        dialectColloquial: dialectColloquial !== false,
        bgmDefaultEnabled: bgmDefaultEnabled !== false,
        sfxDefaultEnabled: sfxDefaultEnabled !== false,
      },
    });
    successResponse(res, { story }, 'Story created');
  } catch (e) {
    next(e);
  }
};

export const createChapter = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { storyId } = req.params;
    const { rawText, chapterNumber, title, contentId, metadata, startJob } = req.body;
    if (!(await assertStoryOwner(storyId, userId))) {
      errorResponse(res, 'Story not found', 404);
      return;
    }
    if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 20) {
      errorResponse(res, 'rawText must be at least 20 characters', 400);
      return;
    }
    if (contentId) {
      const linked = await prisma.content.findFirst({
        where: { id: contentId, authorId: userId },
        select: { id: true, contentType: true },
      });
      if (!linked) {
        errorResponse(res, 'Linked content not found or not owned by you', 404);
        return;
      }
      if (!isNarrationEligibleContentType(linked.contentType)) {
        errorResponse(res, 'Narration is only available for stories (including series episodes)', 400);
        return;
      }
    }
    const chapter = await prisma.narrationChapter.create({
      data: {
        storyId,
        chapterNumber: typeof chapterNumber === 'number' ? chapterNumber : 1,
        title: title?.trim() || null,
        rawText: rawText.trim(),
        contentId: contentId || null,
        metadata: metadata && typeof metadata === 'object' ? metadata : {},
      },
    });

    let job = null;
    if (startJob === true) {
      job = await prisma.narrationJob.create({
        data: { chapterId: chapter.id, status: NarrationJobStatus.QUEUED, currentStage: NarrationJobStage.IDLE },
      });
      await enqueueNarrationStep(job.id, 'preprocess');
    }

    successResponse(res, { chapter, job }, 'Chapter created');
  } catch (e) {
    next(e);
  }
};

export const startAudioJob = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { chapterId } = req.params;
    const chapter = await assertChapterAccess(chapterId, userId);
    if (!chapter) {
      errorResponse(res, 'Chapter not found', 404);
      return;
    }

    const running = await prisma.narrationJob.findFirst({
      where: {
        chapterId,
        status: { in: [NarrationJobStatus.QUEUED, NarrationJobStatus.RUNNING] },
      },
    });
    if (running) {
      errorResponse(res, 'A job is already queued or running for this chapter', 409);
      return;
    }

    const job = await prisma.narrationJob.create({
      data: { chapterId, status: NarrationJobStatus.QUEUED, currentStage: NarrationJobStage.IDLE },
    });
    await enqueueNarrationStep(job.id, 'preprocess');
    successResponse(res, { jobId: job.id }, 'Audio generation started');
  } catch (e) {
    next(e);
  }
};

export const getJobStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { jobId } = req.params;
    const job = await prisma.narrationJob.findFirst({
      where: { id: jobId, chapter: { story: { ownerId: userId } } },
      include: {
        logs: { orderBy: { createdAt: 'desc' }, take: 50 },
        segments: { select: { id: true, segmentIndex: true, ttsStatus: true, durationMs: true } },
      },
    });
    if (!job) {
      errorResponse(res, 'Job not found', 404);
      return;
    }
    successResponse(res, { job }, 'OK');
  } catch (e) {
    next(e);
  }
};

export const retryJob = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { jobId } = req.params;
    const job = await prisma.narrationJob.findFirst({
      where: { id: jobId, chapter: { story: { ownerId: userId } } },
    });
    if (!job) {
      errorResponse(res, 'Job not found', 404);
      return;
    }

    await prisma.narrationSegment.updateMany({
      where: { jobId, ttsStatus: NarrationSegmentTtsStatus.FAILED },
      data: { ttsStatus: NarrationSegmentTtsStatus.PENDING, ttsErrorMessage: null },
    });

    await prisma.narrationJob.update({
      where: { id: jobId },
      data: {
        status: NarrationJobStatus.QUEUED,
        errorMessage: null,
        errorStage: null,
        finishedAt: null,
      },
    });

    let step: 'preprocess' | 'tts' | 'compose' = 'preprocess';
    if (job.geminiJson) {
      const incomplete = await prisma.narrationSegment.count({
        where: { jobId, ttsStatus: { not: NarrationSegmentTtsStatus.COMPLETED } },
      });
      step = incomplete > 0 ? 'tts' : 'compose';
    }

    if (step === 'compose') {
      await prisma.narrationJob.update({
        where: { id: jobId },
        data: { masterAssetId: null, deliveryAssetId: null },
      });
    }

    await enqueueNarrationStep(jobId, step);
    successResponse(res, { jobId, step }, 'Retry queued');
  } catch (e) {
    next(e);
  }
};

export const getChapterAssets = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { chapterId } = req.params;
    const chapter = await assertChapterAccess(chapterId, userId);
    if (!chapter) {
      errorResponse(res, 'Chapter not found', 404);
      return;
    }

    const job = await prisma.narrationJob.findFirst({
      where: { chapterId, status: NarrationJobStatus.COMPLETED },
      orderBy: { finishedAt: 'desc' },
      include: { masterAsset: true, deliveryAsset: true },
    });

    if (!job || !job.deliveryAsset) {
      errorResponse(res, 'No completed audio for this chapter', 404);
      return;
    }

    const storageCfg = getObjectStorage();
    const adapter = storageCfg ? new NarrationStorageAdapter(storageCfg) : null;
    const expires = parseInt(process.env.NARRATION_PRESIGN_TTL_SEC || '3600', 10);

    const deliveryKey = job.deliveryAsset.storageKey;
    const masterKey = job.masterAsset?.storageKey;

    let deliveryUrl: string;
    let masterUrl: string | null = null;

    if (adapter && !deliveryKey.startsWith('/uploads/')) {
      deliveryUrl = (await adapter.presignGet(deliveryKey, expires)) ?? adapter.getPublicUrl(deliveryKey) ?? '';
      if (masterKey && !masterKey.startsWith('/uploads/')) {
        masterUrl = (await adapter.presignGet(masterKey, expires)) ?? adapter.getPublicUrl(masterKey) ?? null;
      }
    } else {
      deliveryUrl = deliveryKey.startsWith('http') ? deliveryKey : `${process.env.BASE_URL || ''}${deliveryKey}`;
      masterUrl = masterKey
        ? masterKey.startsWith('http')
          ? masterKey
          : `${process.env.BASE_URL || ''}${masterKey}`
        : null;
    }

    const segments = await prisma.narrationSegment.findMany({
      where: { jobId: job.id },
      orderBy: { segmentIndex: 'asc' },
      include: { audioAsset: true },
    });

    const segmentUrls: Array<{ segmentIndex: number; url: string | null }> = [];
    for (const s of segments) {
      if (!s.audioAsset) {
        segmentUrls.push({ segmentIndex: s.segmentIndex, url: null });
        continue;
      }
      const sk = s.audioAsset.storageKey;
      if (adapter && !sk.startsWith('/uploads/')) {
        segmentUrls.push({
          segmentIndex: s.segmentIndex,
          url: (await adapter.presignGet(sk, expires)) ?? adapter.getPublicUrl(sk),
        });
      } else {
        segmentUrls.push({
          segmentIndex: s.segmentIndex,
          url: sk.startsWith('http') ? sk : `${process.env.BASE_URL || ''}${sk}`,
        });
      }
    }

    successResponse(
      res,
      {
        jobId: job.id,
        playbackUrl: deliveryUrl,
        deliveryUrl,
        masterUrl,
        waveformMeta: job.waveformMeta,
        segments: segmentUrls,
      },
      'OK'
    );
  } catch (e) {
    next(e);
  }
};

export const previewSegment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { segmentId } = req.params;
    const seg = await prisma.narrationSegment.findFirst({
      where: { id: segmentId, job: { chapter: { story: { ownerId: userId } } } },
      include: { job: { include: { chapter: { include: { story: true } } } } },
    });
    if (!seg) {
      errorResponse(res, 'Segment not found', 404);
      return;
    }

    const genderPref = seg.job.chapter.story.narratorGenderPref;
    const buf = await SarvamNarrationAdapter.synthesizeSegment({
      text: seg.normalizedTtsText,
      language: 'kn',
      role: seg.role,
      narratorGenderPref: genderPref === 'female' || genderPref === 'male' ? genderPref : 'male',
      pace: seg.speed,
    });

    successResponse(
      res,
      {
        segmentId: seg.id,
        audioBase64: buf.toString('base64'),
        format: 'wav',
      },
      'OK'
    );
  } catch (e) {
    next(e);
  }
};

export const regenerateSegment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { segmentId } = req.params;
    const seg = await prisma.narrationSegment.findFirst({
      where: { id: segmentId, job: { chapter: { story: { ownerId: userId } } } },
    });
    if (!seg) {
      errorResponse(res, 'Segment not found', 404);
      return;
    }

    await prisma.$transaction(async (tx) => {
      if (seg.audioAssetId) {
        await tx.narrationAudioAsset.deleteMany({ where: { id: seg.audioAssetId } });
      }
      await tx.narrationSegment.update({
        where: { id: segmentId },
        data: {
          audioAssetId: null,
          ttsStatus: NarrationSegmentTtsStatus.PENDING,
          ttsErrorMessage: null,
        },
      });
      await tx.narrationJob.update({
        where: { id: seg.jobId },
        data: {
          status: NarrationJobStatus.QUEUED,
          masterAssetId: null,
          deliveryAssetId: null,
          errorMessage: null,
          currentStage: NarrationJobStage.TTS_SEGMENTS,
        },
      });
    });

    await enqueueNarrationStep(seg.jobId, 'tts');
    successResponse(res, { jobId: seg.jobId }, 'Segment regeneration queued');
  } catch (e) {
    next(e);
  }
};

export const upsertLexicon = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { rawToken, normalizedToken, spokenOverride, dialect, notes, priority } = req.body;
    if (!rawToken || !normalizedToken) {
      errorResponse(res, 'rawToken and normalizedToken are required', 400);
      return;
    }
    const d = typeof dialect === 'string' ? dialect : 'general';
    const row = await prisma.pronunciationLexicon.upsert({
      where: { rawToken_dialect: { rawToken: String(rawToken).trim(), dialect: d } },
      create: {
        rawToken: String(rawToken).trim(),
        normalizedToken: String(normalizedToken).trim(),
        spokenOverride: spokenOverride?.trim() || null,
        dialect: d,
        notes: notes?.trim() || null,
        priority: typeof priority === 'number' ? priority : 0,
      },
      update: {
        normalizedToken: String(normalizedToken).trim(),
        spokenOverride: spokenOverride?.trim() || null,
        notes: notes?.trim() || null,
        priority: typeof priority === 'number' ? priority : undefined,
      },
    });
    successResponse(res, { entry: row }, 'Lexicon saved');
  } catch (e) {
    next(e);
  }
};
