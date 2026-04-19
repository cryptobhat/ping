import { Router } from 'express';
import { rewardsController } from '../controllers/rewards.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// User endpoints
router.get('/stats', authenticate, rewardsController.getStats);
router.get('/ad-share/history', authenticate, rewardsController.getAdShareHistory);
router.get('/ad-share/program', rewardsController.getAdShareProgram);
router.post('/reading', authenticate, rewardsController.awardReading);
router.post('/redeem', authenticate, rewardsController.redeemPens);

// Admin endpoints
router.post('/redistribution/preview', authenticate, authorize('ADMIN'), rewardsController.previewRedistribution);
router.post('/redistribution/execute', authenticate, authorize('ADMIN'), rewardsController.executeRedistribution);

export default router;
