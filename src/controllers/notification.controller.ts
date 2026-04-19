import { NextFunction, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, paginatedResponse, clampLimit } from '../utils/response';

export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);

    const { notifications, total } = await NotificationService.getUserNotifications(userId, page, limit);
    paginatedResponse(res, notifications, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const count = await NotificationService.getUnreadCount(userId);
    successResponse(res, { unreadCount: count });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await NotificationService.markAsRead(id, userId);
    successResponse(res, null, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;

    await NotificationService.markAllAsRead(userId);
    successResponse(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await NotificationService.deleteNotification(id, userId);
    successResponse(res, null, 'Notification deleted');
  } catch (error) {
    next(error);
  }
};