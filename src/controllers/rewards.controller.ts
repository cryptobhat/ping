import { Request, Response } from 'express';
import { AuthRequest } from '../utils/jwt';
import { rewardsService } from '../services/rewards.service';
import { adRevenueDistributionService } from '../services/ad-revenue-distribution.service';
import { successResponse, errorResponse } from '../utils/response';

export const rewardsController = {
  async getStats(req: AuthRequest, res: Response) {
    try {
      const data = await rewardsService.getRewardStats(req.userId!);
      successResponse(res, data);
    } catch (err: any) { errorResponse(res, err.message, 500); }
  },

  async awardReading(req: AuthRequest, res: Response) {
    try {
      const { contentId, durationMinutes, isCompleted } = req.body;
      if (!contentId || !durationMinutes) {
        errorResponse(res, 'contentId and durationMinutes required', 400);
        return;
      }
      const result = await rewardsService.awardReadingCoins(
        req.userId!, contentId, Number(durationMinutes), isCompleted === true
      );
      successResponse(res, result, 'Coins earned!');
    } catch (err: any) { errorResponse(res, err.message, 500); }
  },

  // Legacy redeem endpoint — pens are dead, return no-op
  async redeemPens(_req: AuthRequest, res: Response) {
    errorResponse(res, 'Pen system has been retired. Everything uses Coins now.', 410);
  },

  async getAdShareHistory(req: AuthRequest, res: Response) {
    try {
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 24));
      const data = await adRevenueDistributionService.getUserAdShareHistory(req.userId!, limit);
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  },

  getAdShareProgram(_req: Request, res: Response) {
    successResponse(res, {
      ...adRevenueDistributionService.program,
      summary:
        '10% of verified gross ad revenue forms the platform pool. 35% of that pool goes to eligible readers (fair reading time, caps apply); 65% to authors (monthly engagement on their public content).',
    });
  },

  // Admin: preview reader + author ad pools
  async previewRedistribution(req: AuthRequest, res: Response) {
    try {
      const { totalAdRevenue, month } = req.body;
      const result = await adRevenueDistributionService.preview(
        Number(totalAdRevenue),
        month || new Date().toISOString().slice(0, 7)
      );
      successResponse(res, result);
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  },

  // Admin: execute — credits wallets, records audit run
  async executeRedistribution(req: AuthRequest, res: Response) {
    try {
      const { totalAdRevenue, month, force } = req.body;
      const result = await adRevenueDistributionService.execute(
        Number(totalAdRevenue),
        month || new Date().toISOString().slice(0, 7),
        req.userId,
        force === true
      );
      successResponse(res, result, 'Ad revenue distributed to readers and authors');
    } catch (err: any) {
      errorResponse(res, err.message, 400);
    }
  },
};
