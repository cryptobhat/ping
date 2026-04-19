import { Router } from 'express';
import * as subscriptionController from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/plans', subscriptionController.getPlans);
// NOTE: Subscriptions are activated only via verified payment flow (payment.controller.ts)
// Direct subscribe endpoint removed to prevent free premium exploit
router.get('/me', authenticate, subscriptionController.getCurrentSubscription);
router.delete('/me', authenticate, subscriptionController.cancelSubscription);

export default router;