import { NextFunction, Response } from 'express';
import { SupportService } from '../services/support.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, paginatedResponse, errorResponse, clampLimit } from '../utils/response';

export const supportCreator = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const supporterId = req.userId!;
    const { receiverId, coins, contentId, message } = req.body;

    const result = await SupportService.supportCreator(supporterId, receiverId, coins, contentId, message);
    successResponse(res, result, 'Support sent successfully', 201);
  } catch (error: any) {
    if (error.message === 'Cannot support yourself' || error.message === 'Insufficient coins balance') {
      errorResponse(res, error.message, 400);
      return;
    }
    next(error);
  }
};

export const getSupportHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);

    const { supports, total } = await SupportService.getSupportHistory(userId, page, limit);
    paginatedResponse(res, supports, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const getReceivedSupports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);

    const { supports, total } = await SupportService.getReceivedSupports(userId, page, limit);
    paginatedResponse(res, supports, page, limit, total);
  } catch (error) {
    next(error);
  }
};