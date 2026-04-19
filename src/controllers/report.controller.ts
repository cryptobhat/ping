import { NextFunction, Response } from 'express';
import { ReportService } from '../services/report.service';
import { AuthRequest } from '../utils/jwt';
import { successResponse, errorResponse, paginatedResponse, clampLimit } from '../utils/response';

export const createReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reporterId = req.userId!;
    const { contentId, reason, description, targetType, targetId } = req.body;

    const hasContentId = typeof contentId === 'string' && contentId.trim().length > 0;
    const hasTarget = typeof targetType === 'string' && typeof targetId === 'string' && targetId.trim().length > 0;
    if (!hasContentId && !hasTarget) {
      errorResponse(res, 'Provide contentId or (targetType and targetId)');
      return;
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      errorResponse(res, 'reason is required');
      return;
    }

    const validReasons = [
      'spam',
      'harassment',
      'hate_speech',
      'violence',
      'sexual_content',
      'copyright',
      'misinformation',
      'other',
    ];

    const normalizedReason = reason.trim().toLowerCase();
    if (!validReasons.includes(normalizedReason)) {
      errorResponse(res, `reason must be one of: ${validReasons.join(', ')}`);
      return;
    }

    const desc = typeof description === 'string' ? description.trim() : undefined;
    if (desc && desc.length > 280) {
      errorResponse(res, 'description must be 280 characters or less');
      return;
    }

    const normalizedTargetType = hasTarget ? String(targetType).toUpperCase() : undefined;
    if (normalizedTargetType && !['CONTENT', 'USER', 'COMMENT', 'MESSAGE'].includes(normalizedTargetType)) {
      errorResponse(res, 'targetType must be one of: CONTENT, USER, COMMENT, MESSAGE');
      return;
    }

    if (hasContentId) {
      const authorId = await ReportService.getContentAuthorId(contentId);
      if (!authorId) {
        errorResponse(res, 'Content not found', 404);
        return;
      }
      if (authorId === reporterId) {
        errorResponse(res, 'You cannot report your own content');
        return;
      }

      const duplicate = await ReportService.hasOpenDuplicateReport(reporterId, contentId);
      if (duplicate) {
        errorResponse(res, 'You already have an open report for this content', 409);
        return;
      }
    } else if (normalizedTargetType && targetId) {
      if (normalizedTargetType === 'USER' && targetId === reporterId) {
        errorResponse(res, 'You cannot report yourself');
        return;
      }
      const duplicate = await ReportService.hasOpenDuplicateTargetReport(
        reporterId,
        normalizedTargetType as 'CONTENT' | 'USER' | 'COMMENT' | 'MESSAGE',
        targetId,
      );
      if (duplicate) {
        errorResponse(res, 'You already have an open report for this target', 409);
        return;
      }
    }

    const report = await ReportService.createReport(reporterId, {
      contentId: hasContentId ? contentId : undefined,
      reason: normalizedReason,
      description: desc,
      targetType: normalizedTargetType as any,
      targetId: typeof targetId === 'string' ? targetId : undefined,
    });

    successResponse(res, report, 'Report submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const listReports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = clampLimit(parseInt(req.query.limit as string) || 20);
    const status = req.query.status as string | undefined;
    const reason = req.query.reason as string | undefined;
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;

    const { reports, total } = await ReportService.listReports({ page, limit, status, reason, from, to });
    paginatedResponse(res, reports, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const resolveReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reportId } = req.params;
    const adminId = req.userId!;
    const { status } = req.body;

    if (!status || !['resolved', 'rejected', 'action_taken'].includes(status)) {
      errorResponse(res, 'status must be one of: resolved, rejected, action_taken');
      return;
    }

    const report = await ReportService.resolveReport(reportId, adminId, status);
    successResponse(res, report, 'Report updated');
  } catch (error: any) {
    if (error.code === 'P2025') {
      errorResponse(res, 'Report not found', 404);
      return;
    }
    next(error);
  }
};
