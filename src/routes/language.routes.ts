import { Router } from 'express';
import * as languageController from '../controllers/language.controller';
import * as translationController from '../controllers/translation.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', languageController.getLanguages);
router.post('/', authenticate, authorize('ADMIN'), languageController.createLanguage);

router.get('/content/:contentId', translationController.getTranslations);
router.get('/content/:contentId/:lang', translationController.getTranslation);
router.post('/content/:contentId', authenticate, translationController.createTranslation);
router.put('/content/:contentId/:lang', authenticate, translationController.updateTranslation);
router.delete('/content/:contentId/:lang', authenticate, translationController.deleteTranslation);

export default router;