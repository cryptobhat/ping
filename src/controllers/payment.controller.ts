import { Request, Response } from 'express';
import { AuthRequest } from '../utils/jwt';
import { successResponse, errorResponse } from '../utils/response';
import { orchestrator } from '../services/payment/orchestrator.service';
import { PaymentFulfillmentService } from '../services/payment/payment-fulfillment.service';
import { GatewayName, PaymentType } from '../services/payment/gateway.interface';
import prisma from '../config/database';

export const paymentController = {
  /**
   * Create a payment order via the smart orchestrator.
   * Selects the best gateway (or uses preferredGateway if specified).
   */
  async createOrder(req: AuthRequest, res: Response) {
    try {
      const { amount, type, planId, packageId, preferredGateway } = req.body;

      if (!amount || amount < 1) {
        errorResponse(res, 'Invalid amount', 400);
        return;
      }

      const receipt = `${type}_${Date.now()}`.slice(0, 40);
      const notes: Record<string, string> = {
        userId: req.userId!,
        type,
      };
      if (planId) notes.planId = planId;
      if (packageId) notes.packageId = packageId;

      const { result, attempt } = await orchestrator.createOrderWithFailover(
        {
          amount,
          currency: 'INR',
          receipt,
          userId: req.userId!,
          paymentType: type as PaymentType,
          notes,
        },
        preferredGateway as GatewayName | undefined
      );

      successResponse(res, {
        attemptId: attempt.id,
        gateway: result.gateway,
        ...result.checkoutData,
        amount: result.amount,
        currency: result.currency,
      }, 'Order created');
    } catch (err: any) {
      errorResponse(res, err.message || 'Failed to create order', 500);
    }
  },

  /**
   * Verify payment after client completes checkout.
   * Works with any gateway via the attemptId lookup.
   */
  async verifyPayment(req: AuthRequest, res: Response) {
    try {
      const { attemptId, gatewayPaymentId, signature, orderId, paymentId, type, planId, packageId } = req.body;

      // ── New flow: attemptId-based (gateway-agnostic) ──
      if (attemptId) {
        const attempt = await prisma.paymentAttempt.findUnique({ where: { id: attemptId } });
        if (!attempt) {
          errorResponse(res, 'Invalid payment attempt', 400);
          return;
        }

        const adapter = orchestrator.getAdapter(attempt.gateway as GatewayName);
        if (!adapter) {
          errorResponse(res, 'Gateway not found', 500);
          return;
        }

        const verification = await adapter.verifyPayment({
          gatewayOrderId: attempt.gatewayOrderId!,
          gatewayPaymentId: gatewayPaymentId || paymentId,
          signature,
        });

        if (!verification.verified) {
          await prisma.paymentAttempt.update({
            where: { id: attemptId },
            data: { status: 'FAILED', errorMessage: 'Verification failed' },
          });
          errorResponse(res, 'Payment verification failed', 400);
          return;
        }

        const { duplicate } = await PaymentFulfillmentService.fulfill({
          userId: req.userId!,
          paymentType: attempt.paymentType as PaymentType,
          amount: verification.amount,
          gatewayPaymentId: verification.gatewayPaymentId,
          gateway: attempt.gateway as GatewayName,
          planId: attempt.planId || undefined,
          packageId: attempt.packageId || undefined,
        });

        await prisma.paymentAttempt.update({
          where: { id: attemptId },
          data: {
            status: 'CAPTURED',
            gatewayPaymentId: verification.gatewayPaymentId,
            completedAt: new Date(),
          },
        });

        successResponse(res, {
          paymentId: verification.gatewayPaymentId,
          verified: true,
          duplicate,
        }, 'Payment verified and processed');
        return;
      }

      // ── Legacy flow: direct Razorpay orderId/paymentId/signature ──
      if (orderId && paymentId && signature) {
        const adapter = orchestrator.getAdapter('razorpay');
        if (!adapter) {
          errorResponse(res, 'Razorpay not configured', 500);
          return;
        }

        const verification = await adapter.verifyPayment({
          gatewayOrderId: orderId,
          gatewayPaymentId: paymentId,
          signature,
        });

        if (!verification.verified) {
          errorResponse(res, 'Payment verification failed', 400);
          return;
        }

        const paymentType = (type || 'wallet') as PaymentType;

        const { duplicate } = await PaymentFulfillmentService.fulfill({
          userId: req.userId!,
          paymentType,
          amount: verification.amount,
          gatewayPaymentId: paymentId,
          gateway: 'razorpay',
          planId,
          packageId,
        });

        successResponse(res, {
          paymentId,
          verified: true,
          duplicate,
        }, 'Payment verified and processed');
        return;
      }

      errorResponse(res, 'Missing required payment fields (need attemptId or orderId+paymentId+signature)', 400);
    } catch (err: any) {
      errorResponse(res, err.message || 'Payment processing failed', 500);
    }
  },

  /**
   * Unified webhook handler — dispatches to correct gateway adapter.
   * Route: POST /webhook/:gateway  OR  POST /webhook (legacy → razorpay)
   */
  async handleWebhook(req: Request, res: Response) {
    try {
      const gatewayParam = (req.params as any).gateway || 'razorpay';
      const adapter = orchestrator.getAdapter(gatewayParam as GatewayName);

      if (!adapter) {
        res.status(404).json({ error: 'Unknown gateway' });
        return;
      }

      const rawBody = JSON.stringify(req.body);
      const headers = req.headers as Record<string, string>;

      if (!adapter.verifyWebhookSignature(rawBody, headers)) {
        res.status(400).json({ error: 'Invalid webhook signature' });
        return;
      }

      const event = adapter.parseWebhookEvent(req.body, headers);

      if (event.status === 'captured' && event.gatewayOrderId) {
        const attempt = await prisma.paymentAttempt.findFirst({
          where: { gatewayOrderId: event.gatewayOrderId, gateway: gatewayParam },
        });

        if (attempt && attempt.status !== 'CAPTURED') {
          await PaymentFulfillmentService.fulfill({
            userId: attempt.userId,
            paymentType: attempt.paymentType as PaymentType,
            amount: event.amount,
            gatewayPaymentId: event.gatewayPaymentId,
            gateway: gatewayParam as GatewayName,
            planId: attempt.planId || undefined,
            packageId: attempt.packageId || undefined,
          });

          await prisma.paymentAttempt.update({
            where: { id: attempt.id },
            data: {
              status: 'CAPTURED',
              gatewayPaymentId: event.gatewayPaymentId,
              completedAt: new Date(),
              webhookReceivedAt: new Date(),
              webhookVerified: true,
            },
          });

          await orchestrator.recordOutcome(gatewayParam as GatewayName, true, 0);
        }
      } else if (event.status === 'failed' && event.gatewayOrderId) {
        const attempt = await prisma.paymentAttempt.findFirst({
          where: { gatewayOrderId: event.gatewayOrderId, gateway: gatewayParam },
        });
        if (attempt && attempt.status !== 'CAPTURED') {
          await prisma.paymentAttempt.update({
            where: { id: attempt.id },
            data: {
              status: 'FAILED',
              webhookReceivedAt: new Date(),
              webhookVerified: true,
              errorMessage: event.rawEvent,
            },
          });
          await orchestrator.recordOutcome(gatewayParam as GatewayName, false, 0);
        }
      }

      res.json({ status: 'ok' });
    } catch (err: any) {
      console.error(`[Payment Webhook Error]`, err);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  },

  /**
   * Get payment gateway metrics (admin endpoint)
   */
  async getMetrics(_req: AuthRequest, res: Response) {
    try {
      const metrics = await orchestrator.getMetrics();
      successResponse(res, metrics, 'Gateway metrics');
    } catch (err: any) {
      errorResponse(res, err.message, 500);
    }
  },
};
