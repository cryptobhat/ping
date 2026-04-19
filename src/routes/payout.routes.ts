import { Router } from 'express';
import { payoutController } from '../controllers/payout.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/earnings', authenticate, payoutController.getEarnings);
router.post('/withdraw', authenticate, payoutController.requestWithdrawal);

export default router;
