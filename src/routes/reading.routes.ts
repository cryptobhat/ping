import { Router } from 'express';
import * as readingController from '../controllers/reading.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/session/start', authenticate, readingController.startSession);
router.put('/session/:sessionId/end', authenticate, readingController.endSession);
router.get('/stats', authenticate, readingController.getStats);
router.get('/history', authenticate, readingController.getSessionHistory);
router.get('/leaderboard', readingController.getLeaderboard);

export default router;