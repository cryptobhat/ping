import { safeEmit } from "../utils/socket-emit";
import { NextFunction, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { FollowService } from '../services/follow.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, paginatedResponse, errorResponse, clampLimit } from '../utils/response';

const RESERVED_FOLLOW_PARAMS = new Set(['followers', 'following']);

async function resolveTargetUserId(raw: string | undefined): Promise<
  { ok: true; id: string } | { ok: false; status: number; message: string }
> {
  const userId = raw?.trim();
  if (!userId) {
    return { ok: false, status: 400, message: 'Invalid user id' };
  }
  if (RESERVED_FOLLOW_PARAMS.has(userId.toLowerCase())) {
    return { ok: false, status: 400, message: 'Invalid user id' };
  }
  const target = await prisma.user.findFirst({
    where: { id: userId, isActive: true },
    select: { id: true },
  });
  if (!target) {
    return { ok: false, status: 404, message: 'User not found' };
  }
  return { ok: true, id: target.id };
}

export const followUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const followerId = req.userId!;
    const resolved = await resolveTargetUserId(req.params.userId);
    if (!resolved.ok) {
      errorResponse(res, resolved.message, resolved.status);
      return;
    }

    const result = await FollowService.followUser(followerId, resolved.id);
    successResponse(res, result, 'Followed successfully', 201);
    safeEmit(resolved.id, 'new_follower', { userId: followerId });
  } catch (error: any) {
    if (error.message === 'Cannot follow yourself') {
      errorResponse(res, error.message, 400);
      return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      errorResponse(res, 'User not found', 404);
      return;
    }
    next(error);
  }
};

export const unfollowUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const followerId = req.userId!;
    const resolved = await resolveTargetUserId(req.params.userId);
    if (!resolved.ok) {
      errorResponse(res, resolved.message, resolved.status);
      return;
    }

    await FollowService.unfollowUser(followerId, resolved.id);
    successResponse(res, null, 'Unfollowed successfully');
    safeEmit(resolved.id, 'follower_removed', { userId: followerId });
  } catch (error: any) {
    next(error);
  }
};

export const getFollowers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);

    const { followers, total } = await FollowService.getFollowers(userId, page, limit);
    paginatedResponse(res, followers, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const getFollowing = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);

    const { following, total } = await FollowService.getFollowing(userId, page, limit);
    paginatedResponse(res, following, page, limit, total);
  } catch (error) {
    next(error);
  }
};