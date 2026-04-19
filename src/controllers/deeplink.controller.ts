import { NextFunction, Response } from 'express';
import { DeepLinkService } from '../services/deeplink.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';

export const getContentDeepLink = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await DeepLinkService.getContentDeepLink(id);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const getUserDeepLink = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await DeepLinkService.getUserDeepLink(id);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const resolveDeepLink = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { code } = req.params;
    const result = await DeepLinkService.resolveDeepLink(code);

    if (!result) {
      errorResponse(res, 'Deep link not found', 404);
      return;
    }

    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};