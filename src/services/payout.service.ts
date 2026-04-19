import prisma from '../config/database';

const COIN_TO_INR = 1; // 1 coin = ₹1
const MIN_WITHDRAWAL = 100; // Minimum ₹100 to withdraw
const PLATFORM_CUT = 0.10; // 10% platform fee

export const payoutService = {
  async getEarnings(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coinsBalance: true, pensBalance: true, walletBalance: true },
    });

    // Get total earned from received supports
    const totalSupports = await prisma.support.aggregate({
      where: { receiverId: userId },
      _sum: { coins: true },
    });

    // Get total earned from received gifts (in coins)
    const totalGifts = await prisma.userGift.aggregate({
      where: { receiverId: userId },
      _sum: { penValue: true },
    });

    // Get past withdrawals
    const withdrawals = await prisma.walletTransaction.findMany({
      where: { userId, type: 'WITHDRAWAL' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const totalEarnedCoins = totalSupports._sum.coins ?? 0;
    const totalEarnedGiftCoins = totalGifts._sum.penValue ?? 0;
    const withdrawableCoins = user?.coinsBalance ?? 0;
    const withdrawableAmount = withdrawableCoins * COIN_TO_INR;

    return {
      coinsBalance: user?.coinsBalance ?? 0,
      pensBalance: user?.pensBalance ?? 0,
      totalEarnedCoins,
      totalEarnedGiftCoins,
      withdrawableAmount,
      minWithdrawal: MIN_WITHDRAWAL,
      platformFeePercent: PLATFORM_CUT * 100,
      withdrawals,
    };
  },

  async requestWithdrawal(userId: string, amount: number, upiId: string) {
    if (amount < MIN_WITHDRAWAL) {
      throw new Error(`Minimum withdrawal is ₹${MIN_WITHDRAWAL}`);
    }

    const coinsNeeded = Math.ceil(amount / COIN_TO_INR);
    const platformFee = Math.round(amount * PLATFORM_CUT);
    const netAmount = amount - platformFee;

    // Read + deduct inside transaction to prevent TOCTOU race
    const [_, withdrawal] = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { coinsBalance: true, name: true },
      });

      if (!user) throw new Error('User not found');

      if ((user.coinsBalance ?? 0) < coinsNeeded) {
        throw new Error(`Insufficient balance. You have ${user.coinsBalance} coins (₹${user.coinsBalance})`);
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: { coinsBalance: { decrement: coinsNeeded } },
      });

      const wt = await tx.walletTransaction.create({
        data: {
          userId,
          type: 'WITHDRAWAL',
          amount: netAmount,
          balance: 0,
          description: `Withdrawal of ₹${amount} (fee: ₹${platformFee}) to UPI: ${upiId}`,
          referenceId: upiId,
          referenceType: 'upi_withdrawal',
          status: 'pending',
        },
      });

      return [updated, wt] as const;
    });

    return {
      id: withdrawal.id,
      grossAmount: amount,
      platformFee,
      netAmount,
      upiId,
      status: 'pending',
      message: `₹${netAmount} will be transferred to ${upiId} within 3-5 business days`,
    };
  },
};
