import { Router } from 'express';
import * as narrationController from '../controllers/narration.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/stories', authenticate, narrationController.createStory);
router.post('/stories/:storyId/chapters', authenticate, narrationController.createChapter);
router.post('/chapters/:chapterId/jobs', authenticate, narrationController.startAudioJob);
router.get('/jobs/:jobId', authenticate, narrationController.getJobStatus);
router.post('/jobs/:jobId/retry', authenticate, narrationController.retryJob);
router.get('/chapters/:chapterId/assets', authenticate, narrationController.getChapterAssets);
router.post('/segments/:segmentId/preview', authenticate, narrationController.previewSegment);
router.post('/segments/:segmentId/regenerate', authenticate, narrationController.regenerateSegment);
router.put('/lexicon', authenticate, authorize('ADMIN'), narrationController.upsertLexicon);

export default router;
