import { NextFunction, Request, Response } from 'express';
import { HashtagService } from '../services/hashtag.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, paginatedResponse, clampLimit } from '../utils/response';

export const getTrending = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = clampLimit(parseInt(req.query.limit as string) || 10);
    const hashtags = await HashtagService.getTrendingHashtags(limit);
    successResponse(res, hashtags);
  } catch (error) {
    next(error);
  }
};

export const getByHashtag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tag } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);
    const language = req.query.language as string | undefined;

    const { content, total } = await HashtagService.getContentByHashtag(tag, page, limit, language);
    paginatedResponse(res, content, page, limit, total);
  } catch (error) {
    next(error);
  }
};