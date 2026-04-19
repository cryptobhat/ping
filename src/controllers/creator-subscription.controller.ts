import { NextFunction, Response } from 'express';
import { CreatorSubscriptionService } from '../services/creator-subscription.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, errorResponse, paginatedResponse, clampLimit } from '../utils/response';

export const checkEligibility = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.userId || req.userId!;
    const result = await CreatorSubscriptionService.checkEligibility(userId);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const setPrice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { priceINR } = req.body;

    if (typeof priceINR !== 'number' || !Number.isInteger(priceINR)) {
      errorResponse(res, 'priceINR must be an integer', 400);
      return;
    }

    const result = await CreatorSubscriptionService.setPrice(userId, priceINR);
    successResponse(res, result, 'Creator price updated');
  } catch (error: any) {
    if (error.message.includes('not eligible') || error.message.includes('must be between')) {
      errorResponse(res, error.message, 400);
      return;
    }
    next(error);
  }
};

export const getCreatorProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const result = await CreatorSubscriptionService.getCreatorProfile(userId);

    // If the current user is logged in, check subscription status
    let isSubscribed = false;
    if (req.userId && req.userId !== userId) {
      isSubscribed = await CreatorSubscriptionService.isSubscribed(req.userId, userId);
    }

    successResponse(res, { ...result, isSubscribed });
  } catch (error: any) {
    if (error.message === 'Creator not found') {
      errorResponse(res, error.message, 404);
      return;
    }
    next(error);
  }
};

export const subscribe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subscriberId = req.userId!;
    const { creatorId } = req.params;

    const result = await CreatorSubscriptionService.subscribe(subscriberId, creatorId);
    successResponse(res, result, 'Subscribed successfully', 201);
  } catch (error: any) {
    if (
      error.message.includes('cannot subscribe') ||
      error.message.includes('already subscribed') ||
      error.message.includes('does not offer') ||
      error.message.includes('Insufficient')
    ) {
      errorResponse(res, error.message, 400);
      return;
    }
    next(error);
  }
};

export const unsubscribe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subscriberId = req.userId!;
    const { creatorId } = req.params;

    const result = await CreatorSubscriptionService.unsubscribe(subscriberId, creatorId);
    successResponse(res, result);
  } catch (error: any) {
    if (error.message.includes('No active subscription')) {
      errorResponse(res, error.message, 400);
      return;
    }
    next(error);
  }
};

export const checkSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subscriberId = req.userId!;
    const { creatorId } = req.params;

    const isSubscribed = await CreatorSubscriptionService.isSubscribed(subscriberId, creatorId);
    successResponse(res, { isSubscribed });
  } catch (error) {
    next(error);
  }
};

export const getSubscribers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const creatorId = req.userId!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);

    const { subscribers, total } = await CreatorSubscriptionService.getSubscribers(creatorId, page, limit);
    paginatedResponse(res, subscribers, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const getMySubscriptions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);

    const { subscriptions, total } = await CreatorSubscriptionService.getMySubscriptions(userId, page, limit);
    paginatedResponse(res, subscriptions, page, limit, total);
  } catch (error) {
    next(error);
  }
};
