import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { updateUserSchema, updateUsernameSchema } from '../validators/auth.validator';

const router = Router();

router.get('/me', authenticate, userController.getCurrentUser);
router.put('/me', authenticate, validateBody(updateUserSchema.shape.body), userController.updateProfile);
router.put('/me/username', authenticate, validateBody(updateUsernameSchema.shape.body), userController.updateUsername);
router.get('/me/wallet', authenticate, userController.getWallet);

router.get('/:username', optionalAuth, userController.getUserByUsername);
router.get('/:id/content', optionalAuth, userController.getUserContent);

export default router;