import { NextFunction, Response } from 'express';
import { LeaderboardService } from '../services/leaderboard.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, clampLimit } from '../utils/response';

export const getTopWriters = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = clampLimit(parseInt(req.query.limit as string) || 20, 50);
    const language = req.query.language as string | undefined;
    const period = req.query.period as 'today' | 'week' | 'month' | undefined;

    const writers = await LeaderboardService.getTopWriters(limit, language, period);
    successResponse(res, writers);
  } catch (error) {
    next(error);
  }
};

export const getTopEarners = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = clampLimit(parseInt(req.query.limit as string) || 20, 50);

    const earners = await LeaderboardService.getTopEarners(limit);
    successResponse(res, earners);
  } catch (error) {
    next(error);
  }
};

export const getWeeklyStars = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = clampLimit(parseInt(req.query.limit as string) || 20, 50);
    const language = req.query.language as string | undefined;

    const stars = await LeaderboardService.getWeeklyStars(limit, language);
    successResponse(res, stars);
  } catch (error) {
    next(error);
  }
};

export const getRisingAuthors = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = clampLimit(parseInt(req.query.limit as string) || 20, 50);
    const language = req.query.language as string | undefined;

    const rising = await LeaderboardService.getRisingAuthors(limit, language);
    successResponse(res, rising);
  } catch (error) {
    next(error);
  }
};
