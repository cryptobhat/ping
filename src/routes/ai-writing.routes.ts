import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as aiWritingController from '../controllers/ai-writing.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Rate limit: max 10 calls per user per minute for writing suggestions
const suggestLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyGenerator: (req: any) => req.userId || req.ip,
  message: { success: false, message: 'Too many AI requests. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/suggest', authenticate, suggestLimiter, aiWritingController.suggest);
router.post('/generate-description', authenticate, aiWritingController.generateDescription);
router.post('/story-teaser', authenticate, aiWritingController.storyTeaser);

export default router;
