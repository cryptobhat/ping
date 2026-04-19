import { NextFunction, Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { LocationService } from '../services/location.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, errorResponse, paginatedResponse, clampLimit } from '../utils/response';
import prisma from '../config/database';

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const user = await UserService.getUserById(userId);

    if (!user) {
      errorResponse(res, 'User not found', 404);
      return;
    }

    // Auto-detect location from IP if not set
    if (!user.location) {
      const clientIp = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip || '';
      LocationService.getLocationFromIP(clientIp).then(loc => {
        if (loc.city && loc.state) {
          prisma.user.update({
            where: { id: user.id },
            data: { location: `${loc.city}, ${loc.state}` },
          }).catch(() => {});
        }
      }).catch(() => {});
    }

    successResponse(res, user);
  } catch (error) {
    next(error);
  }
};

export const getUserByUsername = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username } = req.params;
    const currentUserId = req.userId;

    const user = await UserService.getUserByUsername(username, currentUserId);

    if (!user) {
      errorResponse(res, 'User not found', 404);
      return;
    }

    successResponse(res, user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { name, bio, profileImage, visibility } = req.body;

    const user = await UserService.updateUser(userId, {
      name,
      bio,
      profileImage,
      visibility,
    });

    successResponse(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const updateUsername = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { username } = req.body;

    const user = await UserService.updateUsername(userId, username);

    successResponse(res, user, 'Username updated successfully');
  } catch (error: any) {
    if (error.message === 'Username already taken') {
      errorResponse(res, error.message, 400);
      return;
    }
    next(error);
  }
};

export const getWallet = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const balance = await UserService.getWalletBalance(userId);

    successResponse(res, balance);
  } catch (error) {
    next(error);
  }
};

export const getUserContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);

    const { content, total } = await UserService.getUserContent(id, page, limit);

    paginatedResponse(res, content, page, limit, total);
  } catch (error) {
    next(error);
  }
};