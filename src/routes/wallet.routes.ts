import { Router } from 'express';
import * as walletController from '../controllers/wallet.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { addMoneySchema, withdrawMoneySchema, buyCoinsSchema, buyPensSchema } from '../validators/financial.validator';

const router = Router();

router.get('/', authenticate, walletController.getWallet);
// NOTE: Wallet top-up is handled only via verified payment flow (payment.controller.ts type='wallet')
// Direct /add endpoint removed to prevent unverified wallet credits
router.post('/withdraw', authenticate, validateBody(withdrawMoneySchema), walletController.withdrawMoney);
router.post('/buy-coins', authenticate, validateBody(buyCoinsSchema), walletController.buyCoins);
router.post('/buy-pens', authenticate, validateBody(buyPensSchema), walletController.buyPens);
router.get('/transactions', authenticate, walletController.getTransactions);

export default router;
