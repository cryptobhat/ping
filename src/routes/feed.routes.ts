import { Router } from 'express';
import * as feedController from '../controllers/feed.controller';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// GET /api/v1/feed/for-you — personalized feed (auth optional)
router.get('/for-you', optionalAuth, feedController.forYouFeed);

export default router;
