import { NextFunction, Response } from 'express';
import { TrendingService } from '../services/trending.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, paginatedResponse, clampLimit } from '../utils/response';

export const getTrending = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const timeWindow = (req.query.window as 'daily' | 'weekly' | 'monthly') || 'daily';
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);
    const language = req.query.language as string | undefined;

    const { trending, total } = await TrendingService.getTrending(timeWindow, page, limit, language);
    paginatedResponse(res, trending, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const getTrendingByCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const timeWindow = (req.query.window as 'daily' | 'weekly' | 'monthly') || 'daily';
    const limit = clampLimit(parseInt(req.query.limit as string) || 10);

    const trending = await TrendingService.getTrendingByCategory(categoryId, timeWindow, limit);
    successResponse(res, trending);
  } catch (error) {
    next(error);
  }
};

export const calculateTrending = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const timeWindow = (req.body.window as 'daily' | 'weekly' | 'monthly') || 'daily';
    const result = await TrendingService.calculateAllTrending(timeWindow);
    successResponse(res, result, 'Trending calculated');
  } catch (error) {
    next(error);
  }
};