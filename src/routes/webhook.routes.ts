import { Router } from 'express';
import * as webhookController from '../controllers/webhook.controller';
import { webhookLimiter } from '../middleware/rate-limit';

const router = Router();

router.use(webhookLimiter);

router.post('/ai/content-analysis', webhookController.handleContentAnalysis);
router.post('/ai/trending', webhookController.handleTrendingCalculation);
router.post('/ai/user-interests', webhookController.handleUserInterestsUpdate);
router.post('/ai/recommendations', webhookController.handleRecommendationsUpdate);
router.post('/ai/cleanup', webhookController.handleCleanupJob);

export default router;
