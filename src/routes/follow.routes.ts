import { Router } from 'express';
import * as followController from '../controllers/follow.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Static paths first so they are never captured as :userId (e.g. "followers" / "following").
router.get('/followers', authenticate, followController.getFollowers);
router.get('/following', authenticate, followController.getFollowing);
router.post('/:userId', authenticate, followController.followUser);
router.delete('/:userId', authenticate, followController.unfollowUser);

export default router;