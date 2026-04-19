import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/database';
import { AiService } from '../services/ai.service';
import { successResponse, errorResponse } from '../utils/response';

const N8N_SECRET = process.env.N8N_WEBHOOK_SECRET || '';

function verifyWebhookSecret(req: Request): boolean {
  // Only accept secret from header (never from body — body can be logged/leaked)
  const provided = (req.headers['x-webhook-secret'] as string) || '';
  if (!N8N_SECRET || !provided) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(N8N_SECRET),
      Buffer.from(provided)
    );
  } catch {
    return false;
  }
}

export const handleContentAnalysis = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId, contentId, result } = req.body;

    if (!verifyWebhookSecret(req)) {
      errorResponse(res, 'Invalid webhook secret', 401);
      return;
    }

    if (!jobId || !contentId || !result) {
      errorResponse(res, 'Missing required fields', 400);
      return;
    }

    await AiService.markJobProcessing(jobId);

    await AiService.saveContentAnalysis(contentId, {
      autoTags: result.autoTags || [],
      sentimentScore: result.sentimentScore || null,
      sentimentLabel: result.sentimentLabel || null,
      qualityScore: result.qualityScore || null,
      readingLevel: result.readingLevel || null,
      keywords: result.keywords || [],
    });

    await AiService.markJobCompleted(jobId, result);

    successResponse(res, null, 'Content analysis saved');
  } catch (error: any) {
    if (req.body.jobId) {
      await AiService.markJobFailed(req.body.jobId, error.message);
    }
    next(error);
  }
};

export const handleTrendingCalculation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { timeWindow = 'daily' } = req.body;

    if (!verifyWebhookSecret(req)) {
      errorResponse(res, 'Invalid webhook secret', 401);
      return;
    }

    const { TrendingService } = await import('../services/trending.service');
    const result = await TrendingService.calculateAllTrending(timeWindow);

    successResponse(res, result, 'Trending calculated');
  } catch (error) {
    next(error);
  }
};

export const handleUserInterestsUpdate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!verifyWebhookSecret(req)) {
      errorResponse(res, 'Invalid webhook secret', 401);
      return;
    }

    await AiService.updateUserInterests(userId);

    successResponse(res, null, 'User interests updated');
  } catch (error) {
    next(error);
  }
};

export const handleRecommendationsUpdate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userIds } = req.body;

    if (!verifyWebhookSecret(req)) {
      errorResponse(res, 'Invalid webhook secret', 401);
      return;
    }

    if (!Array.isArray(userIds)) {
      errorResponse(res, 'userIds must be an array', 400);
      return;
    }

    const results = [];
    for (const userId of userIds) {
      const recommendations = await AiService.getUserRecommendations(userId, 10);
      results.push({ userId, count: recommendations.length });
    }

    successResponse(res, results, 'Recommendations updated');
  } catch (error) {
    next(error);
  }
};

export const handleCleanupJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!verifyWebhookSecret(req)) {
      errorResponse(res, 'Invalid webhook secret', 401);
      return;
    }

    await prisma.aiProcessingQueue.deleteMany({
      where: {
        status: 'completed',
        processedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    successResponse(res, null, 'Cleanup completed');
  } catch (error) {
    next(error);
  }
};