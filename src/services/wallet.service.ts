import prisma from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';

export class WalletService {
  static async getWalletBalance(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true, coinsBalance: true, pensBalance: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      walletBalance: Number(user.walletBalance),
      coinsBalance: user.coinsBalance,
      pensBalance: user.pensBalance,
    };
  }

  static async addMoneyToWallet(userId: string, amount: number, paymentId: string) {
    const result = await prisma.$transaction(async (tx) => {
      // Read inside transaction to prevent race conditions
      const currentBalance = await tx.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
      });

      if (!currentBalance) {
        throw new Error('User not found');
      }

      const newBalance = Number(currentBalance.walletBalance) + amount;

      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: new Decimal(newBalance) },
      });

      const walletTx = await tx.walletTransaction.create({
        data: {
          userId,
          type: 'DEPOSIT',
          amount: new Decimal(amount),
          balance: new Decimal(newBalance),
          description: 'Money added to wallet',
          referenceId: paymentId,
          referenceType: 'payment',
          status: 'completed',
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'PURCHASE',
          amount: amount * 100,
          referenceId: walletTx.id,
          referenceType: 'wallet_deposit',
          status: 'COMPLETED',
          metadata: { paymentId },
        },
      });

      return { transactionId: walletTx.id, newBalance };
    });

    return result;
  }

  static async withdrawFromWallet(userId: string, amount: number, description: string) {
    return prisma.$transaction(async (tx) => {
      // Read inside transaction to prevent TOCTOU race conditions
      const currentBalance = await tx.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
      });

      if (!currentBalance) {
        throw new Error('User not found');
      }

      if (Number(currentBalance.walletBalance) < amount) {
        throw new Error('Insufficient wallet balance');
      }

      const newBalance = Number(currentBalance.walletBalance) - amount;

      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: new Decimal(newBalance) },
      });

      return tx.walletTransaction.create({
        data: {
          userId,
          type: 'WITHDRAWAL',
          amount: new Decimal(amount),
          balance: new Decimal(newBalance),
          description,
          status: 'completed',
        },
      });
    });
  }

  static async buyCoinsWithWallet(userId: string, coins: number) {
    const amount = coins;

    return prisma.$transaction(async (tx) => {
      const currentBalance = await tx.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true, coinsBalance: true },
      });

      if (!currentBalance) {
        throw new Error('User not found');
      }

      if (Number(currentBalance.walletBalance) < amount) {
        throw new Error('Insufficient wallet balance');
      }

      const newWalletBalance = Number(currentBalance.walletBalance) - amount;
      const newCoinsBalance = currentBalance.coinsBalance + coins;

      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: new Decimal(newWalletBalance),
          coinsBalance: newCoinsBalance,
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          type: 'COIN_PURCHASE',
          amount: new Decimal(amount),
          balance: new Decimal(newWalletBalance),
          description: `Purchased ${coins} coins`,
          status: 'completed',
        },
      });

      return tx.transaction.create({
        data: {
          userId,
          type: 'PURCHASE',
          amount: coins,
          referenceId: null,
          referenceType: 'coin_purchase_wallet',
          status: 'COMPLETED',
        },
      });
    });
  }

  static async buyPensWithWallet(userId: string, pens: number) {
    const amount = pens * 40;

    return prisma.$transaction(async (tx) => {
      // Read inside transaction to prevent TOCTOU race conditions
      const currentBalance = await tx.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true, pensBalance: true },
      });

      if (!currentBalance) {
        throw new Error('User not found');
      }

      if (Number(currentBalance.walletBalance) < amount) {
        throw new Error('Insufficient wallet balance');
      }

      const newWalletBalance = Number(currentBalance.walletBalance) - amount;
      const newPensBalance = currentBalance.pensBalance + pens;

      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: new Decimal(newWalletBalance),
          pensBalance: newPensBalance,
        },
      });

      return tx.walletTransaction.create({
        data: {
          userId,
          type: 'PEN_PURCHASE',
          amount: new Decimal(amount),
          balance: new Decimal(newWalletBalance),
          description: `Purchased ${pens} pens`,
          status: 'completed',
        },
      });
    });
  }

  static async getWalletTransactions(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.walletTransaction.count({ where: { userId } }),
    ]);

    return { transactions, total };
  }
}