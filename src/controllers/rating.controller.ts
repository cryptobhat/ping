import { NextFunction, Response } from 'express';
import { RatingService } from '../services/rating.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, paginatedResponse, errorResponse, clampLimit } from '../utils/response';

export const rateAuthor = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reviewerId = req.userId!;
    const { authorId } = req.params;
    const { rating, review, isAnonymous } = req.body;

    const result = await RatingService.rateAuthor(reviewerId, authorId, rating, review, isAnonymous);
    successResponse(res, result, 'Rating submitted', 201);
  } catch (error: any) {
    if (error.message === 'Cannot rate yourself' || error.message === 'Rating must be between 1 and5') {
      errorResponse(res, error.message, 400);
      return;
    }
    next(error);
  }
};

export const getAuthorRatings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { authorId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);

    const result = await RatingService.getAuthorRatings(authorId, page, limit);
    paginatedResponse(res, result.ratings, page, limit, result.total);
  } catch (error) {
    next(error);
  }
};

export const getAuthorRatingStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { authorId } = req.params;
    const result = await RatingService.getAuthorRatings(authorId, 1, 0);
    successResponse(res, {
      averageRating: result.averageRating,
      totalRatings: result.totalRatings,
      distribution: result.distribution,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserRating = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reviewerId = req.userId!;
    const { authorId } =req.params;

    const rating = await RatingService.getUserRatingForAuthor(reviewerId, authorId);
    successResponse(res, rating);
  } catch (error) {
    next(error);
  }
};

export const getTopRatedAuthors = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = clampLimit(parseInt(req.query.limit as string) || 10);
    const authors = await RatingService.getTopRatedAuthors(limit);
    successResponse(res, authors);
  } catch (error) {
    next(error);
  }
};