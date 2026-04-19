import { Router } from 'express';
import * as leaderboardController from '../controllers/leaderboard.controller';

const router = Router();

router.get('/writers', leaderboardController.getTopWriters);
router.get('/earners', leaderboardController.getTopEarners);
router.get('/weekly', leaderboardController.getWeeklyStars);
router.get('/rising', leaderboardController.getRisingAuthors);

export default router;
