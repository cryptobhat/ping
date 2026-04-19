import { Router } from 'express';
import * as readingGoalsController from '../controllers/reading-goals.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/v1/reading/goals — get user's reading goals and streak
router.get('/', authenticate, readingGoalsController.getGoals);

// PUT /api/v1/reading/goals — update daily reading goal
router.put('/', authenticate, readingGoalsController.updateGoal);

// POST /api/v1/reading/goals/log — log a reading session
router.post('/log', authenticate, readingGoalsController.logSession);

export default router;
