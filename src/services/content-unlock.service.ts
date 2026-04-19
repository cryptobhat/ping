import prisma from '../config/database';
import { getEconomyConfig } from './site-config.service';

export class ContentUnlockService {
  /**
   * Check whether a user has unlocked a specific content.
   */
  static async hasUnlocked(userId: string, contentId: string): Promise<boolean> {
    const record = await prisma.contentUnlock.findUnique({
      where: { userId_contentId: { userId, contentId } },
    });
    return !!record;
  }

  /**
   * Unlock content by spending Coins. Credits 80% (configurable) to the author as INR.
   */
  static async unlock(userId: string, contentId: string) {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { id: true, authorId: true, unlockPrice: true, title: true },
    });

    if (!content) throw new Error('Content not found');
    if (!content.unlockPrice || content.unlockPrice <= 0) {
      throw new Error('This content is free');
    }
    if (content.authorId === userId) {
      throw new Error('You are the author — no unlock needed');
    }

    // Check if already unlocked
    const existing = await prisma.contentUnlock.findUnique({
      where: { userId_contentId: { userId, contentId } },
    });
    if (existing) {
      throw new Error('Already unlocked');
    }

    const cfg = await getEconomyConfig();
    const commissionPct = cfg.platform_commission_percent;
    const coinsPerRupee = cfg.coins_per_rupee;
    const authorSharePct = (100 - commissionPct) / 100;
    const authorCreditINR = (content.unlockPrice / coinsPerRupee) * authorSharePct;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { coinsBalance: true },
      });

      if (!user || user.coinsBalance < content.unlockPrice!) {
        throw new Error(`Insufficient coins. Need ${content.unlockPrice} Coins, have ${user?.coinsBalance ?? 0}`);
      }

      // Deduct coins from reader
      await tx.user.update({
        where: { id: userId },
        data: { coinsBalance: { decrement: content.unlockPrice! } },
      });

      // Credit author wallet in INR
      await tx.user.update({
        where: { id: content.authorId },
        data: { walletBalance: { increment: authorCreditINR } },
      });

      // Create unlock record
      const unlock = await tx.contentUnlock.create({
        data: {
          userId,
          contentId,
          coinsSpent: content.unlockPrice!,
        },
      });

      // Record wallet transaction for reader (debit)
      await tx.walletTransaction.create({
        data: {
          userId,
          type: 'PURCHASE',
          amount: -content.unlockPrice!,
          balance: 0,
          description: `Unlocked: ${content.title || 'content'} (${content.unlockPrice} Coins)`,
          referenceId: contentId,
          referenceType: 'content_unlock',
        },
      });

      // Record wallet transaction for author (credit in INR)
      await tx.walletTransaction.create({
        data: {
          userId: content.authorId,
          type: 'REWARD',
          amount: authorCreditINR,
          balance: 0,
          description: `Episode unlock: ${content.title || 'content'} (${commissionPct}% platform fee)`,
          referenceId: contentId,
          referenceType: 'content_unlock_credit',
        },
      });

      return unlock;
    });

    return { unlocked: true, ...result };
  }
}
