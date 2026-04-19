import { Router } from 'express';
import * as trendingController from '../controllers/trending.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', trendingController.getTrending);
router.get('/category/:categoryId', trendingController.getTrendingByCategory);
router.post('/calculate', authenticate, authorize('ADMIN'), trendingController.calculateTrending);

export default router;