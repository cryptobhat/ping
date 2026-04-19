import { NextFunction, Response } from 'express';
import { ReferralService } from '../services/referral.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';

export const getReferralCode = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const code = await ReferralService.getOrCreateReferralCode(userId);
    successResponse(res, { referralCode: code });
  } catch (error) {
    next(error);
  }
};

export const getReferralStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const stats = await ReferralService.getReferralStats(userId);
    successResponse(res, stats);
  } catch (error) {
    next(error);
  }
};

export const applyReferralCode = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { referralCode } = req.body;

    if (!referralCode || typeof referralCode !== 'string' || referralCode.length < 4) {
      errorResponse(res, 'Invalid referral code', 400);
      return;
    }

    const applied = await ReferralService.applyReferralCode(userId, referralCode);

    if (!applied) {
      errorResponse(res, 'Invalid referral code or already referred', 400);
      return;
    }

    successResponse(res, { applied: true, reward: 25 }, 'Referral applied! You earned 25 coins');
  } catch (error) {
    next(error);
  }
};
