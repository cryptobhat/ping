import { Router } from 'express';
import * as commentController from '../controllers/comment.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/content/:contentId', authenticate, commentController.createComment);
router.get('/content/:contentId', optionalAuth, commentController.getComments);
router.put('/:id', authenticate, commentController.updateComment);
router.delete('/:id', authenticate, commentController.deleteComment);
router.post('/:id/like', authenticate, commentController.toggleCommentLike);
router.post('/:id/pin', authenticate, commentController.pinComment);

export default router;