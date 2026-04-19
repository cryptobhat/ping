import prisma from '../config/database';

export class CoinService {
  static async getPackages() {
    return prisma.coinPackage.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Credit coins after verified payment.
   * Called internally from the payment verification flow — NOT directly from a user endpoint.
   */
  static async creditAfterPayment(userId: string, packageId: string, paymentId: string): Promise<{ transactionId: string; coins: number }> {
    const pkg = await prisma.coinPackage.findUnique({
      where: { id: packageId },
    });

    if (!pkg || !pkg.isActive) {
      throw new Error('Invalid package');
    }

    const totalCoins = Number(pkg.coins) + Number(pkg.bonusCoins);

    const transaction = await prisma.$transaction(async (tx) => {
      const t = await tx.transaction.create({
        data: {
          userId,
          type: 'PURCHASE',
          amount: totalCoins,
          referenceId: paymentId,
          referenceType: 'razorpay',
          status: 'COMPLETED',
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          coinsBalance: { increment: totalCoins },
        },
      });

      return t;
    });

    return {
      transactionId: transaction.id,
      coins: totalCoins,
    };
  }

  static async getTransactionHistory(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: { userId } }),
    ]);

    return { transactions, total };
  }
}