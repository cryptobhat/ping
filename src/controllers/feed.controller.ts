import { NextFunction, Response } from 'express';
import { PersonalizedFeedService } from '../services/personalized-feed.service';
import { AuthRequest } from '../utils/jwt';
import { paginatedResponse, clampLimit } from '../utils/response';

export const forYouFeed = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);
    const userId = req.userId;

    // For authenticated users, return personalized feed; otherwise trending
    const { content, total } = userId
      ? await PersonalizedFeedService.getForYouFeed(userId, page, limit)
      : await PersonalizedFeedService.getTrendingFallback(page, limit);

    paginatedResponse(res, content, page, limit, total);
  } catch (error) {
    next(error);
  }
};
