import { Router } from 'express';
import * as contentController from '../controllers/content.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createContentSchema, updateContentSchema } from '../validators/content.validator';
import { trackingLimiter } from '../middleware/rate-limit';

const router = Router();

router.get('/daily-topic', contentController.getDailyTopic);
router.post('/', authenticate, validateBody(createContentSchema.shape.body), contentController.createContent);
router.get('/drafts', authenticate, contentController.getDrafts);
router.get('/', optionalAuth, contentController.getFeed);
router.get('/:id', optionalAuth, contentController.getContent);
router.put('/:id', authenticate, validateBody(updateContentSchema.shape.body), contentController.updateContent);
router.delete('/:id', authenticate, contentController.deleteContent);
router.post('/:id/like', authenticate, contentController.toggleLike);
router.post('/:id/share', trackingLimiter, optionalAuth, contentController.trackShare);
router.get('/:id/supporters', optionalAuth, contentController.getSupporters);
router.post('/:id/unlock', authenticate, contentController.unlockContent);
router.post('/:id/unlock-pay', authenticate, contentController.unlockContentPay);
router.post('/:id/unlock-pay/verify', authenticate, contentController.verifyUnlockPay);

export default router;
