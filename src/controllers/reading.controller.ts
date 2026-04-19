import { NextFunction, Response } from 'express';
import { ReadingService } from '../services/reading.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, paginatedResponse, errorResponse, clampLimit } from '../utils/response';
import { trackEvent, AnalyticsEvent } from '../services/analytics.service';

export const startSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { contentId } = req.body;

    const session = await ReadingService.startSession(userId, contentId);

    trackEvent(userId, AnalyticsEvent.CONTENT_READ, { contentId });

    successResponse(res, session, 'Reading session started', 201);
  } catch (error) {
    next(error);
  }
};

export const endSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { sessionId } = req.params;
    const { durationSeconds, wordsRead, scrollPercentage, isCompleted } = req.body;

    const session = await ReadingService.endSession(sessionId, userId, {
      durationSeconds,
      wordsRead,
      scrollPercentage,
      isCompleted,
    });

    successResponse(res, session, 'Reading session completed');
  } catch (error: any) {
    if (error.code === 'P2025') {
      errorResponse(res, 'Session not found', 404);
      return;
    }
    next(error);
  }
};

export const getStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const stats = await ReadingService.getReadingStats(userId);
    successResponse(res, stats);
  } catch (error) {
    next(error);
  }
};

export const getSessionHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);

    const { sessions, total } = await ReadingService.getSessionHistory(userId, page, limit);
    paginatedResponse(res, sessions, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const type = (req.query.type as 'time' | 'streak') || 'time';
    const limit = clampLimit(parseInt(req.query.limit as string) || 10);

    const leaderboard = await ReadingService.getLeaderboard(type, limit);
    successResponse(res, leaderboard);
  } catch (error) {
    next(error);
  }
};