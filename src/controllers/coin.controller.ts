import { NextFunction, Response } from 'express';
import { CoinService } from '../services/coin.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, paginatedResponse, clampLimit } from '../utils/response';

export const getPackages = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const packages = await CoinService.getPackages();
    successResponse(res, packages);
  } catch (error) {
    next(error);
  }
};

// purchaseCoins endpoint removed — coins are credited only via verified payment flow

export const getTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);

    const { transactions, total } = await CoinService.getTransactionHistory(userId, page, limit);
    paginatedResponse(res, transactions, page, limit, total);
  } catch (error) {
    next(error);
  }
};