import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/recommendations', authenticate, aiController.getRecommendations);
router.post('/interact/:contentId', authenticate, aiController.markInteracted);
router.get('/analysis/:contentId', authenticate, aiController.getAnalysis);
router.post('/analysis/:contentId/trigger', authenticate, authorize('ADMIN'), aiController.triggerAnalysis);

router.post('/jobs/pending', authenticate, authorize('ADMIN'), aiController.getPendingJobs);
router.post('/jobs/:jobId/process', authenticate, authorize('ADMIN'), aiController.processJob);
router.post('/jobs/:jobId/fail', authenticate, authorize('ADMIN'), aiController.failJob);
router.post('/analysis/:contentId/save', authenticate, authorize('ADMIN'), aiController.saveAnalysis);

export default router;