import prisma from '../config/database';

export class SubscriptionService {
  static async getPlans() {
    return prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Activate a subscription after verified payment.
   * Called internally from the payment verification flow — NOT directly from a user endpoint.
   */
  static async activateAfterPayment(userId: string, planId: string, paymentId: string): Promise<{ subscriptionId: string; endDate: Date }> {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      throw new Error('Invalid plan');
    }

    const existingSubscription = await prisma.userSubscription.findFirst({
      where: { userId, isActive: true, endDate: { gte: new Date() } },
    });

    if (existingSubscription) {
      throw new Error('User already has an active subscription');
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const result = await prisma.$transaction(async (tx) => {
      const subscription = await tx.userSubscription.create({
        data: {
          userId,
          planId,
          startDate,
          endDate,
          isActive: true,
          autoRenew: false,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { isPremium: true },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'SUBSCRIPTION',
          amount: Number(plan.price),
          referenceId: paymentId,
          referenceType: 'razorpay',
          status: 'COMPLETED',
        },
      });

      return subscription;
    });

    return {
      subscriptionId: result.id,
      endDate: result.endDate,
    };
  }

  static async getCurrentSubscription(userId: string) {
    return prisma.userSubscription.findFirst({
      where: {
        userId,
        isActive: true,
        endDate: { gte: new Date() },
      },
      include: {
        plan: true,
      },
    });
  }

  static async cancelSubscription(userId: string) {
    const subscription = await prisma.userSubscription.findFirst({
      where: { userId, isActive: true },
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    await prisma.$transaction([
      prisma.userSubscription.update({
        where: { id: subscription.id },
        data: { autoRenew: false },
      }),
    ]);

    return { message: 'Auto-renew canceled' };
  }
}