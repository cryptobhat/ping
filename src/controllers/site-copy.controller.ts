import { NextFunction, Request, Response } from 'express';
import { SiteCopyService } from '../services/site-copy.service';
import { successResponse } from '../utils/response';

export const getSiteCopyPublic = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const raw = (req.query.pages as string) || 'home';
    const pages = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const lang = String(req.query.lang || 'en');
    const data = await SiteCopyService.getMergedForPages(pages, lang);
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};
