import { Router } from 'express';
import * as siteCopyController from '../controllers/site-copy.controller';

const router = Router();

router.get('/', siteCopyController.getSiteCopyPublic);

export default router;
