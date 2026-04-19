import { Router } from 'express';
import * as giftController from '../controllers/gift.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { sendGiftSchema } from '../validators/financial.validator';

const router = Router();

router.get('/', giftController.getAllGifts);
router.post('/send', authenticate, validateBody(sendGiftSchema), giftController.sendGift);
router.get('/received', authenticate, giftController.getReceivedGifts);
router.get('/sent', authenticate, giftController.getSentGifts);

export default router;
