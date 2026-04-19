import { Router } from 'express';
import * as creatorController from '../controllers/creator-subscription.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Authenticated: check own eligibility
router.get('/eligibility', authenticate, creatorController.checkEligibility);

// Authenticated: check any user's eligibility (for profile pages)
router.get('/:userId/eligibility', optionalAuth, creatorController.checkEligibility);

// Authenticated: set own creator price
router.put('/price', authenticate, creatorController.setPrice);

// Public (with optional auth for subscription check): get creator profile
router.get('/:userId/profile', optionalAuth, creatorController.getCreatorProfile);

// Authenticated: subscribe to a creator
router.post('/:creatorId/subscribe', authenticate, creatorController.subscribe);

// Authenticated: unsubscribe from a creator
router.delete('/:creatorId/subscribe', authenticate, creatorController.unsubscribe);

// Authenticated: check if subscribed to a creator
router.get('/:creatorId/subscribed', authenticate, creatorController.checkSubscription);

// Authenticated: list my subscribers (as a creator)
router.get('/subscribers', authenticate, creatorController.getSubscribers);

// Authenticated: list creators I subscribe to
router.get('/subscriptions', authenticate, creatorController.getMySubscriptions);

export default router;
