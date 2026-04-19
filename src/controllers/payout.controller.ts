import { Response } from 'express';
import { AuthRequest } from '../utils/jwt';
import { payoutService } from '../services/payout.service';
import { successResponse, errorResponse } from '../utils/response';
import { trackEvent, AnalyticsEvent } from '../services/analytics.service';

export const payoutController = {
  async getEarnings(req: AuthRequest, res: Response) {
    try {
      const data = await payoutService.getEarnings(req.userId!);
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  },

  async requestWithdrawal(req: AuthRequest, res: Response) {
    try {
      const { amount, upiId } = req.body;
      if (!amount || !upiId) {
        errorResponse(res, 'Amount and UPI ID are required', 400);
        return;
      }
      if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(upiId) || upiId.length > 50) {
        errorResponse(res, 'Invalid UPI ID format', 400);
        return;
      }
      const result = await payoutService.requestWithdrawal(req.userId!, Number(amount), upiId);
      trackEvent(req.userId!, AnalyticsEvent.WITHDRAWAL_REQUESTED, {
        amount: Number(amount),
      });
      successResponse(res, result, 'Withdrawal requested');
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  },
};
