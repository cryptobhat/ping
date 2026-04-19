import { Router } from 'express';
import { seriesController } from '../controllers/series.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Public
router.get('/', optionalAuth, seriesController.list);
router.get('/popular', optionalAuth, seriesController.getPopular);
router.get('/:id', optionalAuth, seriesController.getById);

// Authenticated
router.post('/', authenticate, seriesController.create);
router.put('/:id', authenticate, seriesController.update);
router.delete('/:id', authenticate, seriesController.delete);

// Series items
router.post('/:id/items', authenticate, seriesController.addItem);
router.delete('/:id/items/:contentId', authenticate, seriesController.removeItem);
router.put('/:id/items/reorder', authenticate, seriesController.reorderItems);

// Follow
router.post('/:id/follow', authenticate, seriesController.toggleFollow);

export default router;
