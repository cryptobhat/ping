import { Router } from 'express';
import * as referralController from '../controllers/referral.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/code', authenticate, referralController.getReferralCode);
router.get('/stats', authenticate, referralController.getReferralStats);
router.post('/apply', authenticate, referralController.applyReferralCode);

export default router;
