import { NextFunction, Response } from 'express';
import { FavoriteService } from '../services/favorite.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, paginatedResponse, clampLimit } from '../utils/response';

export const addFavorite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { contentId } = req.params;

    const favorite = await FavoriteService.addToFavorites(userId, contentId);
    successResponse(res, favorite, 'Added to favorites', 201);
  } catch (error) {
    next(error);
  }
};

export const removeFavorite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { contentId } = req.params;

    const result = await FavoriteService.removeFromFavorites(userId, contentId);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const getFavorites = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);

    const { favorites, total } = await FavoriteService.getFavorites(userId, page, limit);
    paginatedResponse(res, favorites, page, limit, total);
  } catch (error) {
    next(error);
  }
};