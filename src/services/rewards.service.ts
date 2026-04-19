import prisma from '../config/database';
import { getEconomyConfig } from './site-config.service';

/**
 * KALALOKA COIN ECONOMY — Simplified Rewards System
 *
 * ONE currency: COINS
 *   - Rs 1 = 10 Coins (configurable via `coins_per_rupee`)
 *   - Minimum withdrawal: 400 Coins = Rs 40 (configurable)
 *
 * How readers earn Coins:
 *   - Valid reading session (3min + 50% scroll): reading_reward_coins (default 2)
 *   - Completing a full story: completion_bonus (default 5)
 *   - 7-day reading streak: streak_bonus_7day (default 10)
 *   - Referral: referral_reward (default 100)
 *   - Daily cap: daily_coin_cap (default 20 Coins = Rs 2/day)
 *
 * All values are admin-configurable from the SiteConfig table.
 * Pens are DEAD — everything is Coins.
 */

/** Minimum reading duration (minutes) before any coins are awarded */
const MIN_READING_MINUTES = 3;
/** Minimum scroll percentage to qualify for reading reward */
const MIN_SCROLL_PERCENT = 50;

export const rewardsService = {
  /**
   * Award Coins for a reading session.
   */
  async awardReadingCoins(userId: string, contentId: string, durationMinutes: number, isCompleted: boolean) {
    const cfg = await getEconomyConfig();
    const REWARD_COINS = cfg.reading_reward_coins;
    const DAILY_CAP = cfg.daily_coin_cap;
    const COMPLETION_BONUS = cfg.completion_bonus;
    const STREAK_BONUS = cfg.streak_bonus_7day;

    // Validate against server-side reading session to prevent fabricated durations
    const recentSession = await prisma.readingSession.findFirst({
      where: { userId, contentId },
      orderBy: { createdAt: 'desc' },
    });

    // Cap duration to server-tracked session or max 60 minutes
    let validatedDuration = Math.min(durationMinutes, 60);
    if (recentSession && recentSession.durationSeconds) {
      const serverDurationMinutes = recentSession.durationSeconds / 60;
      validatedDuration = Math.min(validatedDuration, serverDurationMinutes + 1);
    }

    // GATE: Must read at least 3 minutes AND scroll at least 50%
    const scrollPct = recentSession?.scrollPercentage ?? 0;
    if (validatedDuration < MIN_READING_MINUTES || scrollPct < MIN_SCROLL_PERCENT) {
      return {
        coinsEarned: 0,
        reasons: [`No coins: read ${Math.floor(validatedDuration)}min (need ${MIN_READING_MINUTES}) / ${scrollPct}% scroll (need ${MIN_SCROLL_PERCENT}%)`],
      };
    }

    // Check daily cap — how many coins already earned today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEarned = await prisma.walletTransaction.aggregate({
      where: { userId, referenceType: 'reading_reward', amount: { gt: 0 }, createdAt: { gte: today } },
      _sum: { amount: true },
    });
    const alreadyEarnedToday = Number(todayEarned._sum.amount ?? 0);
    if (alreadyEarnedToday >= DAILY_CAP) {
      return {
        coinsEarned: 0,
        reasons: [`Daily cap reached (${DAILY_CAP} Coins/day)`],
      };
    }

    let totalCoins = REWARD_COINS;
    const reasons: string[] = [`+${REWARD_COINS} Coins for reading session`];

    // Completion bonus
    if (isCompleted) {
      totalCoins += COMPLETION_BONUS;
      reasons.push(`+${COMPLETION_BONUS} Coins completion bonus`);
    }

    // Streak bonus (7+ consecutive days)
    const stats = await prisma.readingStats.findUnique({ where: { userId } });
    if (stats && stats.currentStreakDays >= 7) {
      totalCoins += STREAK_BONUS;
      reasons.push(`+${STREAK_BONUS} Coins streak bonus (${stats.currentStreakDays} days)`);
    }

    // Enforce daily cap
    const remainingToday = DAILY_CAP - alreadyEarnedToday;
    if (totalCoins > remainingToday) {
      totalCoins = Math.max(0, remainingToday);
      reasons.push(`(capped to daily limit of ${DAILY_CAP} Coins)`);
    }

    if (totalCoins <= 0) {
      return { coinsEarned: 0, reasons: ['Daily cap reached'] };
    }

    // Award coins
    await prisma.user.update({
      where: { id: userId },
      data: { coinsBalance: { increment: totalCoins } },
    });

    // Record the transaction
    await prisma.walletTransaction.create({
      data: {
        userId,
        type: 'REWARD',
        amount: totalCoins,
        balance: 0,
        description: reasons.join(', '),
        referenceId: contentId,
        referenceType: 'reading_reward',
      },
    });

    return { coinsEarned: totalCoins, reasons };
  },

  /**
   * Award coins for sharing content (kept for backward compat, gives 2 coins).
   */
  async awardShareCoins(userId: string, contentId: string) {
    const shareReward = 2;
    await prisma.user.update({
      where: { id: userId },
      data: { coinsBalance: { increment: shareReward } },
    });
    await prisma.walletTransaction.create({
      data: {
        userId, type: 'REWARD', amount: shareReward, balance: 0,
        description: `+${shareReward} Coins for sharing content`,
        referenceId: contentId, referenceType: 'share_reward',
      },
    });
    return { coinsEarned: shareReward };
  },

  /**
   * Comment rewards DISABLED — too easy to game.
   */
  async awardCommentPoints(_userId: string, _contentId: string) {
    return { coinsEarned: 0 };
  },

  /**
   * Get user's reward / economy stats.
   */
  async getRewardStats(userId: string) {
    const cfg = await getEconomyConfig();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coinsBalance: true, walletBalance: true },
    });

    const stats = await prisma.readingStats.findUnique({ where: { userId } });

    // Total coins earned all time
    const totalEarned = await prisma.walletTransaction.aggregate({
      where: { userId, referenceType: { in: ['reading_reward', 'share_reward'] }, amount: { gt: 0 } },
      _sum: { amount: true },
    });

    // Coins earned today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEarned = await prisma.walletTransaction.aggregate({
      where: { userId, referenceType: { in: ['reading_reward', 'share_reward'] }, amount: { gt: 0 }, createdAt: { gte: today } },
      _sum: { amount: true },
    });

    // Coins earned this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEarned = await prisma.walletTransaction.aggregate({
      where: { userId, referenceType: { in: ['reading_reward', 'share_reward'] }, amount: { gt: 0 }, createdAt: { gte: monthStart } },
      _sum: { amount: true },
    });

    const coinsBalance = user?.coinsBalance ?? 0;
    const coinsPerRupee = cfg.coins_per_rupee;

    return {
      coinsBalance,
      coinsValueINR: coinsPerRupee > 0 ? coinsBalance / coinsPerRupee : 0,
      walletBalanceINR: Number(user?.walletBalance ?? 0),
      totalCoinsEarned: Number(totalEarned._sum.amount ?? 0),
      todayCoinsEarned: Number(todayEarned._sum.amount ?? 0),
      monthCoinsEarned: Number(monthEarned._sum.amount ?? 0),
      dailyCoinCap: cfg.daily_coin_cap,
      currentStreak: stats?.currentStreakDays ?? 0,
      longestStreak: stats?.longestStreakDays ?? 0,
      minWithdrawalCoins: cfg.min_withdrawal_coins,
      coinsPerRupee,
    };
  },
};
