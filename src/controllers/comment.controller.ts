import { NextFunction, Response } from 'express';
import { CommentService } from '../services/comment.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, paginatedResponse, errorResponse, clampLimit } from '../utils/response';

export const createComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { contentId } = req.params;
    const { body, parentId } = req.body;

    const comment = await CommentService.createComment(userId, contentId, body, parentId);
    successResponse(res, comment, 'Comment added', 201);
  } catch (error: any) {
    if (error.message === 'Comments are not allowed on this content') {
      errorResponse(res, error.message, 400);
      return;
    }
    next(error);
  }
};

export const getComments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { contentId } = req.params;
    const parentId = req.query.parentId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);

    const { comments, total } = await CommentService.getComments(contentId, page, limit, parentId);
    paginatedResponse(res, comments, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { body } = req.body;

    const comment = await CommentService.updateComment(userId, id, body);
    successResponse(res, comment);
  } catch (error: any) {
    if (error.message === 'Unauthorized or comment not found') {
      errorResponse(res, error.message, 403);
      return;
    }
    next(error);
  }
};

export const deleteComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await CommentService.deleteComment(userId, id);
    successResponse(res, result);
  } catch (error: any) {
    if (error.message === 'Unauthorized or comment not found') {
      errorResponse(res, error.message, 403);
      return;
    }
    next(error);
  }
};

export const toggleCommentLike = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await CommentService.toggleLike(userId, id);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const pinComment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await CommentService.pinComment(userId, id);
    successResponse(res, result);
  } catch (error: any) {
    if (error.message === 'Only content author can pin comments') {
      errorResponse(res, error.message, 403);
      return;
    }
    next(error);
  }
};