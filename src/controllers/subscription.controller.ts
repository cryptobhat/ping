import { NextFunction, Response } from 'express';
import { SubscriptionService } from '../services/subscription.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';
import { trackEvent, AnalyticsEvent } from '../services/analytics.service';

export const getPlans = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const plans = await SubscriptionService.getPlans();
    successResponse(res, plans);
  } catch (error) {
    next(error);
  }
};

// subscribe endpoint removed — subscriptions are activated only via verified payment flow

export const getCurrentSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const subscription = await SubscriptionService.getCurrentSubscription(userId);
    successResponse(res, subscription);
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const result = await SubscriptionService.cancelSubscription(userId);
    successResponse(res, result);
  } catch (error: any) {
    if (error.message === 'No active subscription found') {
      errorResponse(res, error.message, 404);
      return;
    }
    next(error);
  }
};