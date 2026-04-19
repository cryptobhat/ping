import { Router } from 'express';
import * as bannerController from '../controllers/banner.controller';

const router = Router();

// Public route — active banners
router.get('/active', bannerController.getActiveBanners);

export default router;
