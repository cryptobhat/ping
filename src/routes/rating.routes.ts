import { Router } from 'express';
import * as ratingController from '../controllers/rating.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/author/:authorId', authenticate, ratingController.rateAuthor);
router.get('/author/:authorId', optionalAuth, ratingController.getAuthorRatings);
router.get('/author/:authorId/stats', optionalAuth, ratingController.getAuthorRatingStats);
router.get('/author/:authorId/me', authenticate, ratingController.getUserRating);
router.get('/top', optionalAuth, ratingController.getTopRatedAuthors);

export default router;