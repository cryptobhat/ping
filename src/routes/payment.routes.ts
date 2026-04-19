import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { paymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createOrderSchema, verifyPaymentSchema } from '../validators/financial.validator';

const router = Router();

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many webhook requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Order + Verify ──
router.post('/create-order', authenticate, validateBody(createOrderSchema), paymentController.createOrder);
router.post('/verify', authenticate, validateBody(verifyPaymentSchema), paymentController.verifyPayment);

// ── Webhooks ──
// Per-gateway webhook: /webhook/razorpay, /webhook/easebuzz, /webhook/phonepe, /webhook/zoho
router.post('/webhook/:gateway', webhookLimiter, paymentController.handleWebhook);
// Legacy Razorpay webhook (backward compat)
router.post('/webhook', webhookLimiter, paymentController.handleWebhook);

// ── Metrics (admin) ──
router.get('/gateway-metrics', authenticate, paymentController.getMetrics);

export default router;
