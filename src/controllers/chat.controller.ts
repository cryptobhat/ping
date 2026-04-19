import { NextFunction, Response } from 'express';
import { ChatService } from '../services/chat.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, paginatedResponse, errorResponse, clampLimit } from '../utils/response';

export const getConversations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);

    const { conversations, total } = await ChatService.getConversations(userId, page, limit);
    paginatedResponse(res, conversations, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length !== 1) {
      errorResponse(res, 'Provide one userId for direct conversation', 400);
      return;
    }

    const conversationId = await ChatService.createConversation([userId, ...userIds]);
    successResponse(res, { conversationId }, 'Conversation created', 201);
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const participants = await ChatService.getMessages(id, userId, 1, 1);
    successResponse(res, participants);
  } catch (error: any) {
    if (error.message === 'Not a participant') {
      errorResponse(res, error.message, 403);
      return;
    }
    next(error);
  }
};

export const getMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 50);

    const { messages, total } = await ChatService.getMessages(id, userId, page, limit);
    paginatedResponse(res, messages, page, limit, total);
  } catch (error: any) {
    if (error.message === 'Not a participant') {
      errorResponse(res, error.message, 403);
      return;
    }
    next(error);
  }
};

export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { content, messageType } = req.body;

    const message = await ChatService.sendMessage(id, userId, content, messageType);
    successResponse(res, message, 'Message sent', 201);
  } catch (error: any) {
    if (error.message === 'Not a participant') {
      errorResponse(res, error.message,403);
      return;
    }
    next(error);
  }
};

export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    await ChatService.markAsRead(id, userId);
    successResponse(res, null, 'Marked as read');
  } catch (error) {
    next(error);
  }
};