import prisma from '../../config/database';
import { GatewayName, PaymentType } from './gateway.interface';

interface FulfillParams {
  userId: string;
  paymentType: PaymentType;
  amount: number;
  gatewayPaymentId: string;
  gateway: GatewayName;
  planId?: string;
  packageId?: string;
}

export class PaymentFulfillmentService {
  /**
   * Idempotent fulfillment — credits wallet/coins/subscription/pens after verified payment.
   * Safe to call from both verify endpoint and webhook handler.
   */
  static async fulfill(params: FulfillParams): Promise<{ duplicate: boolean }> {
    // Idempotency: check if already fulfilled
    const existing = await prisma.paymentAttempt.findFirst({
      where: { gatewayPaymentId: params.gatewayPaymentId, status: 'CAPTURED' },
    });
    if (existing) return { duplicate: true };

    // Also check old Transaction table for backward compat
    const existingTx = await prisma.transaction.findFirst({
      where: { referenceId: params.gatewayPaymentId, status: 'COMPLETED' },
    });
    if (existingTx) return { duplicate: true };

    const { userId, paymentType, amount, gatewayPaymentId, gateway } = params;

    await prisma.$transaction(async (tx) => {
      if (paymentType === 'wallet') {
        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { increment: amount } },
        });
        await tx.walletTransaction.create({
          data: {
            userId,
            type: 'CREDIT',
            amount,
            balance: 0, // will be updated by next read
            description: `Added money via ${gateway}`,
            referenceId: gatewayPaymentId,
            referenceType: gateway,
          },
        });
        await tx.transaction.create({
          data: {
            userId,
            type: 'PURCHASE',
            amount: Number(amount),
            referenceId: gatewayPaymentId,
            referenceType: gateway,
            status: 'COMPLETED',
          },
        });

      } else if (paymentType === 'coins' && params.packageId) {
        const pkg = await tx.coinPackage.findUnique({ where: { id: params.packageId } });
        if (!pkg) throw new Error('Invalid coin package');
        const totalCoins = pkg.coins + pkg.bonusCoins;
        await tx.user.update({
          where: { id: userId },
          data: { coinsBalance: { increment: totalCoins } },
        });
        await tx.transaction.create({
          data: {
            userId,
            type: 'PURCHASE',
            amount: totalCoins,
            referenceId: gatewayPaymentId,
            referenceType: gateway,
            status: 'COMPLETED',
          },
        });

      } else if (paymentType === 'subscription' && params.planId) {
        const plan = await tx.subscriptionPlan.findUnique({ where: { id: params.planId } });
        if (!plan) throw new Error('Invalid subscription plan');
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
        await tx.userSubscription.create({
          data: { userId, planId: plan.id, startDate, endDate, isActive: true },
        });
        await tx.user.update({
          where: { id: userId },
          data: { isPremium: true },
        });
        await tx.transaction.create({
          data: {
            userId,
            type: 'SUBSCRIPTION',
            amount: Number(amount),
            referenceId: gatewayPaymentId,
            referenceType: gateway,
            status: 'COMPLETED',
          },
        });

      } else if (paymentType === 'pens' && params.packageId) {
        const pkg = await tx.penPackage.findUnique({ where: { id: params.packageId } });
        if (!pkg) throw new Error('Invalid pen package');
        const totalPens = pkg.pens + pkg.bonusPens;
        await tx.user.update({
          where: { id: userId },
          data: { pensBalance: { increment: totalPens } },
        });
        await tx.transaction.create({
          data: {
            userId,
            type: 'PEN_PURCHASE',
            amount: totalPens,
            referenceId: gatewayPaymentId,
            referenceType: gateway,
            status: 'COMPLETED',
          },
        });
      }
    });

    return { duplicate: false };
  }
}
