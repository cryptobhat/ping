import { NextFunction, Response } from 'express';
import { AiService } from '../services/ai.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, paginatedResponse, errorResponse, clampLimit } from '../utils/response';

export const getRecommendations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);

    const recommendations = await AiService.getUserRecommendations(userId, limit);
    successResponse(res, recommendations);
  } catch (error) {
    next(error);
  }
};

export const markInteracted = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { contentId } = req.params;

    await AiService.markRecommendationInteracted(userId, contentId);
    successResponse(res, null, 'Marked as interacted');
  } catch (error) {
    next(error);
  }
};

export const triggerAnalysis = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { contentId } = req.params;

    const job = await AiService.queueContentAnalysis(contentId);
    successResponse(res, job, 'Analysis queued', 201);
  } catch (error: any) {
    if (error.message === 'Content not found') {
      errorResponse(res, error.message, 404);
      return;
    }
    next(error);
  }
};

export const getPendingJobs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = clampLimit(parseInt(req.query.limit as string) || 10);
    const jobs = await AiService.getPendingAnalysisJobs(limit);
    successResponse(res, jobs);
  } catch (error) {
    next(error);
  }
};

export const processJob = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const { result } = req.body;

    await AiService.markJobCompleted(jobId, result);
    successResponse(res, null, 'Job marked as completed');
  } catch (error) {
    next(error);
  }
};

export const failJob = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const { error: errorMsg } = req.body;

    await AiService.markJobFailed(jobId, errorMsg);
    successResponse(res, null, 'Job marked as failed');
  } catch (error) {
    next(error);
  }
};

export const saveAnalysis = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { contentId } = req.params;
    const { autoTags, sentimentScore, sentimentLabel, qualityScore, readingLevel, keywords } = req.body;

    const analysis = await AiService.saveContentAnalysis(contentId, {
      autoTags,
      sentimentScore,
      sentimentLabel,
      qualityScore,
      readingLevel,
      keywords,
    });

    successResponse(res, analysis, 'Analysis saved');
  } catch (error) {
    next(error);
  }
};

export const getAnalysis = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { contentId } = req.params;

    const prisma = (await import('../config/database')).default;

    const analysis = await prisma.contentAnalysis.findUnique({
      where: { contentId },
    });

    if (!analysis) {
      errorResponse(res, 'Analysis not found', 404);
      return;
    }

    successResponse(res, analysis);
  } catch (error) {
    next(error);
  }
};