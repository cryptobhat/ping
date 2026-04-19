import { Request, Response, NextFunction } from 'express';
import { BannerService } from '../services/banner.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';

export const getActiveBanners = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const banners = await BannerService.getActive();
    successResponse(res, banners);
  } catch (error) {
    next(error);
  }
};

export const getAllBanners = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const banners = await BannerService.getAll();
    successResponse(res, banners);
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const banner = await BannerService.create(req.body);
    successResponse(res, banner, 'Banner created', 201);
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const banner = await BannerService.update(id, req.body);
    successResponse(res, banner, 'Banner updated');
  } catch (error: any) {
    if (error.message === 'Banner not found') {
      errorResponse(res, error.message, 404);
      return;
    }
    next(error);
  }
};

export const deleteBanner = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await BannerService.delete(id);
    successResponse(res, result);
  } catch (error: any) {
    if (error.message === 'Banner not found') {
      errorResponse(res, error.message, 404);
      return;
    }
    next(error);
  }
};
