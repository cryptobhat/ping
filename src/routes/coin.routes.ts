import { Router } from 'express';
import * as coinController from '../controllers/coin.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { purchaseCoinsSchema } from '../validators/financial.validator';

const router = Router();

router.get('/packages', coinController.getPackages);
// NOTE: Coin purchase is handled only via verified payment flow (payment.controller.ts)
// Direct purchase endpoint removed to prevent free coins exploit
router.get('/transactions', authenticate, coinController.getTransactions);

export default router;
