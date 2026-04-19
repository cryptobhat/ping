import { Response } from 'express';
import { AuthRequest } from '../utils/jwt';
import { competitionService } from '../services/competition.service';
import { successResponse, errorResponse } from '../utils/response';
import { trackEvent, AnalyticsEvent } from '../services/analytics.service';

export const competitionController = {
  async list(req: AuthRequest, res: Response) {
    try {
      const status = req.query.status as any;
      const data = await competitionService.list(status);
      successResponse(res, data);
    } catch (err: any) { errorResponse(res, err.message, 500); }
  },

  async getActive(req: AuthRequest, res: Response) {
    try {
      const data = await competitionService.getActive();
      successResponse(res, data);
    } catch (err: any) { errorResponse(res, err.message, 500); }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const data = await competitionService.getById(req.params.id);
      if (!data) { errorResponse(res, 'Competition not found', 404); return; }
      successResponse(res, data);
    } catch (err: any) { errorResponse(res, err.message, 500); }
  },

  async getLeaderboard(req: AuthRequest, res: Response) {
    try {
      const data = await competitionService.getLeaderboard(req.params.id);
      successResponse(res, data);
    } catch (err: any) { errorResponse(res, err.message, 500); }
  },

  async enter(req: AuthRequest, res: Response) {
    try {
      const { contentId } = req.body;
      const entry = await competitionService.enter(req.params.id, req.userId!, contentId);
      trackEvent(req.userId!, AnalyticsEvent.CONTENT_CREATED, {
        type: 'competition_entry',
        competitionId: req.params.id,
        contentId,
      });
      successResponse(res, entry, 'Entered competition', 201);
    } catch (err: any) { errorResponse(res, err.message, 400); }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const data = await competitionService.create({ ...req.body, createdById: req.userId });
      successResponse(res, data, 'Competition created', 201);
    } catch (err: any) { errorResponse(res, err.message, 500); }
  },

  async updateScores(req: AuthRequest, res: Response) {
    try {
      await competitionService.updateScores(req.params.id);
      successResponse(res, null, 'Scores updated');
    } catch (err: any) { errorResponse(res, err.message, 500); }
  },
};
