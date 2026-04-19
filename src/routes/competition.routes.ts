import { Router } from 'express';
import { competitionController } from '../controllers/competition.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, competitionController.list);
router.get('/active', optionalAuth, competitionController.getActive);
router.get('/:id', optionalAuth, competitionController.getById);
router.get('/:id/leaderboard', optionalAuth, competitionController.getLeaderboard);
router.post('/:id/enter', authenticate, competitionController.enter);

// Admin-only
router.post('/', authenticate, authorize('ADMIN'), competitionController.create);
router.post('/:id/update-scores', authenticate, authorize('ADMIN'), competitionController.updateScores);

export default router;
