import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import * as socialAuthController from '../controllers/social-auth.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { sendOtpSchema, verifyOtpSchema } from '../validators/auth.validator';
import { otpSendLimiter, otpVerifyLimiter, socialAuthLimiter } from '../middleware/rate-limit';

const router = Router();

router.post('/send-otp', otpSendLimiter, validateBody(sendOtpSchema.shape.body), authController.sendOtp);
router.post('/verify-otp', otpVerifyLimiter, validateBody(verifyOtpSchema.shape.body), authController.verifyOtp);
router.post('/google', socialAuthLimiter, socialAuthController.googleAuth);
router.post('/facebook', socialAuthLimiter, socialAuthController.facebookAuth);
router.post('/refresh-token', authenticate, authController.refreshToken);
router.post('/logout', authenticate, authController.logout);

export default router;
