import { Router } from 'express';
import * as bookmarkController from '../controllers/bookmark.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/content/:contentId', authenticate, bookmarkController.addBookmark);
router.delete('/content/:contentId', authenticate, bookmarkController.removeBookmark);
router.get('/', authenticate, bookmarkController.getBookmarks);
router.get('/collections', authenticate, bookmarkController.getCollections);

export default router;