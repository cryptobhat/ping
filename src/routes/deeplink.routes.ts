import { Router } from 'express';
import * as deeplinkController from '../controllers/deeplink.controller';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/content/:id', optionalAuth, deeplinkController.getContentDeepLink);
router.get('/user/:id', optionalAuth, deeplinkController.getUserDeepLink);
router.get('/resolve/:code', optionalAuth, deeplinkController.resolveDeepLink);

export default router;