import { Router } from 'express';
import * as favoriteController from '../controllers/favorite.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/content/:contentId', authenticate, favoriteController.addFavorite);
router.delete('/content/:contentId', authenticate, favoriteController.removeFavorite);
router.get('/', authenticate, favoriteController.getFavorites);

export default router;