import { NextFunction, Response } from 'express';
import { GiftService } from '../services/gift.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, paginatedResponse, errorResponse, clampLimit } from '../utils/response';
import { trackEvent, AnalyticsEvent } from '../services/analytics.service';

export const getAllGifts = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const gifts = await GiftService.getAllGifts();
    successResponse(res, gifts);
  } catch (error) {
    next(error);
  }
};

export const sendGift = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const senderId = req.userId!;
    const { receiverId, giftId, message } = req.body;

    if (senderId === receiverId) {
      errorResponse(res, 'Cannot send gift to yourself', 400);
      return;
    }

    const result = await GiftService.sendGift(senderId, receiverId, giftId, message);
    trackEvent(senderId, AnalyticsEvent.GIFT_SENT, { receiverId, giftId });
    successResponse(res, result, 'Gift sent successfully', 201);
  } catch (error: any) {
    if (error.message === 'Invalid gift' || error.message === 'Insufficient coins balance') {
      errorResponse(res, error.message, 400);
      return;
    }
    next(error);
  }
};

export const getReceivedGifts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);

    const { gifts, total } = await GiftService.getReceivedGifts(userId, page, limit);
    paginatedResponse(res, gifts, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const getSentGifts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);

    const { gifts, total } = await GiftService.getSentGifts(userId, page, limit);
    paginatedResponse(res, gifts, page, limit, total);
  } catch (error) {
    next(error);
  }
};