import { Response } from 'express';
import { AuthRequest } from '../utils/jwt';
import { seriesService } from '../services/series.service';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { trackEvent, AnalyticsEvent } from '../services/analytics.service';

export const seriesController = {
  async create(req: AuthRequest, res: Response) {
    try {
      const series = await seriesService.create(req.userId!, req.body);
      trackEvent(req.userId!, AnalyticsEvent.SERIES_CREATED, {
        seriesId: series.id,
        title: req.body.title,
      });
      successResponse(res, series, 'Series created', 201);
    } catch (err: any) {
      errorResponse(res, err.message || 'Failed to create series', 500);
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const series = await seriesService.getById(req.params.id, req.userId);
      if (!series) {
        errorResponse(res, 'Series not found', 404);
        return;
      }
      successResponse(res, series);
    } catch (err: any) {
      errorResponse(res, err.message || 'Failed to fetch series', 500);
    }
  },

  async list(req: AuthRequest, res: Response) {
    try {
      const { page, limit, language, authorId, categoryId, status } = req.query;
      const result = await seriesService.list({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        language: language as string,
        authorId: authorId as string,
        categoryId: categoryId as string,
        status: status as any,
      });
      paginatedResponse(res, result.data, result.page, result.limit, result.total);
    } catch (err: any) {
      errorResponse(res, err.message || 'Failed to list series', 500);
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const series = await seriesService.update(req.params.id, req.userId!, req.body);
      if (!series) {
        errorResponse(res, 'Series not found or unauthorized', 404);
        return;
      }
      successResponse(res, series, 'Series updated');
    } catch (err: any) {
      errorResponse(res, err.message || 'Failed to update series', 500);
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const deleted = await seriesService.delete(req.params.id, req.userId!);
      if (!deleted) {
        errorResponse(res, 'Series not found or unauthorized', 404);
        return;
      }
      successResponse(res, null, 'Series deleted');
    } catch (err: any) {
      errorResponse(res, err.message || 'Failed to delete series', 500);
    }
  },

  async addItem(req: AuthRequest, res: Response) {
    try {
      const { contentId } = req.body;
      const item = await seriesService.addItem(req.params.id, req.userId!, contentId);
      if (!item) {
        errorResponse(res, 'Series not found or unauthorized', 404);
        return;
      }
      successResponse(res, item, 'Item added to series', 201);
    } catch (err: any) {
      if (err.code === 'P2002') {
        errorResponse(res, 'Content already in this series', 409);
        return;
      }
      errorResponse(res, err.message || 'Failed to add item', 500);
    }
  },

  async removeItem(req: AuthRequest, res: Response) {
    try {
      const removed = await seriesService.removeItem(
        req.params.id,
        req.userId!,
        req.params.contentId
      );
      if (!removed) {
        errorResponse(res, 'Series not found or unauthorized', 404);
        return;
      }
      successResponse(res, null, 'Item removed from series');
    } catch (err: any) {
      errorResponse(res, err.message || 'Failed to remove item', 500);
    }
  },

  async reorderItems(req: AuthRequest, res: Response) {
    try {
      const { itemIds } = req.body;
      const reordered = await seriesService.reorderItems(req.params.id, req.userId!, itemIds);
      if (!reordered) {
        errorResponse(res, 'Series not found or unauthorized', 404);
        return;
      }
      successResponse(res, null, 'Items reordered');
    } catch (err: any) {
      errorResponse(res, err.message || 'Failed to reorder items', 500);
    }
  },

  async toggleFollow(req: AuthRequest, res: Response) {
    try {
      const result = await seriesService.toggleFollow(req.params.id, req.userId!);
      successResponse(res, result);
    } catch (err: any) {
      errorResponse(res, err.message || 'Failed to toggle follow', 500);
    }
  },

  async getPopular(req: AuthRequest, res: Response) {
    try {
      const { language, limit } = req.query;
      const data = await seriesService.getPopular(
        language as string,
        limit ? Number(limit) : undefined
      );
      successResponse(res, data);
    } catch (err: any) {
      errorResponse(res, err.message || 'Failed to fetch popular series', 500);
    }
  },
};
