import { NextFunction, Response } from 'express';
import { WalletService } from '../services/wallet.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, paginatedResponse, errorResponse, clampLimit } from '../utils/response';

export const getWallet = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const wallet = await WalletService.getWalletBalance(userId);
    successResponse(res, wallet);
  } catch (error) {
    next(error);
  }
};

export const addMoney = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { amount, paymentId } = req.body;

    if (amount < 10) {
      errorResponse(res, 'Minimum amount is ₹10', 400);
      return;
    }

    const result = await WalletService.addMoneyToWallet(userId, amount, paymentId);
    successResponse(res, result, 'Money added to wallet', 201);
  } catch (error: any) {
    if (error.message === 'User not found') {
      errorResponse(res, error.message, 404);
      return;
    }
    next(error);
  }
};

export const withdrawMoney = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { amount, description } = req.body;

    if (amount < 100) {
      errorResponse(res, 'Minimum withdrawal is ₹100', 400);
      return;
    }

    const result = await WalletService.withdrawFromWallet(userId, amount, description);
    successResponse(res, result);
  } catch (error: any) {
    if (error.message === 'Insufficient wallet balance') {
      errorResponse(res, error.message, 400);
      return;
    }
    next(error);
  }
};

export const buyCoins = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { coins } = req.body;

    if (coins < 10) {
      errorResponse(res, 'Minimum purchase is 10 coins', 400);
      return;
    }

    const result = await WalletService.buyCoinsWithWallet(userId, coins);
    successResponse(res, result, `Purchased ${coins} coins for ₹${coins}`, 201);
  } catch (error: any) {
    if (error.message === 'Insufficient wallet balance') {
      errorResponse(res, error.message, 400);
      return;
    }
    next(error);
  }
};

export const buyPens = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { pens } = req.body;

    if (pens < 1) {
      errorResponse(res, 'Minimum purchase is 1 pen', 400);
      return;
    }

    const result = await WalletService.buyPensWithWallet(userId, pens);
    const cost = pens * 40;
    successResponse(res, result, `Purchased ${pens} pens for ₹${cost}`, 201);
  } catch (error: any) {
    if (error.message === 'Insufficient wallet balance') {
      errorResponse(res, error.message, 400);
      return;
    }
    next(error);
  }
};

export const getTransactions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);

    const { transactions, total } = await WalletService.getWalletTransactions(userId, page, limit);
    paginatedResponse(res, transactions, page, limit, total);
  } catch (error) {
    next(error);
  }
};