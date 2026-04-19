import { Router } from 'express';
import * as supportController from '../controllers/support.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, supportController.supportCreator);
router.get('/history', authenticate, supportController.getSupportHistory);
router.get('/received', authenticate, supportController.getReceivedSupports);

export default router;