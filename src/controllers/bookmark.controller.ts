import { NextFunction, Response } from 'express';
import { BookmarkService } from '../services/bookmark.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, paginatedResponse, errorResponse, clampLimit } from '../utils/response';

export const addBookmark = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { contentId } = req.params;
    const { collectionName } = req.body;

    const bookmark = await BookmarkService.addToBookmark(userId, contentId, collectionName);
    successResponse(res, bookmark, 'Bookmarked', 201);
  } catch (error) {
    next(error);
  }
};

export const removeBookmark = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { contentId } = req.params;

    const result = await BookmarkService.removeFromBookmark(userId, contentId);
    successResponse(res, result);
  } catch (error: any) {
    if (error.message === 'Bookmark not found') {
      errorResponse(res, error.message, 404);
      return;
    }
    next(error);
  }
};

export const getBookmarks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const collectionName = req.query.collection as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);

    const { bookmarks, total } = await BookmarkService.getBookmarks(userId, collectionName, page, limit);
    paginatedResponse(res, bookmarks, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const getCollections = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const collections = await BookmarkService.getCollections(userId);
    successResponse(res, collections);
  } catch (error) {
    next(error);
  }
};