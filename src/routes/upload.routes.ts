import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../services/upload.service';
import * as uploadController from '../controllers/upload.controller';

const router = Router();

// POST /api/v1/upload/image?type=image|cover|avatar
router.post('/image', authenticate, upload.single('image'), uploadController.uploadImage);

// POST /api/v1/upload/images?type=image (max 5)
router.post('/images', authenticate, upload.array('images', 5), uploadController.uploadMultiple);

export default router;
