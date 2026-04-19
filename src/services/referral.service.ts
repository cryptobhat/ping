import prisma from '../config/database';
import crypto from 'crypto';
import { NotificationService } from './notification.service';
import { getConfigNumber } from './site-config.service';

// Defaults overridden by SiteConfig `referral_reward`
const DEFAULT_REFERRER_REWARD = 100;
const DEFAULT_REFERRED_REWARD = 50;

export class ReferralService {
  /**
   * Generate a unique referral code for a user (if they don't already have one)
   */
  static async getOrCreateReferralCode(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true, username: true },
    });

    if (!user) throw new Error('User not found');

    if (user.referralCode) return user.referralCode;

    // Generate code: username prefix + random suffix
    const prefix = user.username.slice(0, 4).toUpperCase();
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
    const code = `${prefix}${suffix}`;

    await prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
    });

    return code;
  }

  /**
   * Apply a referral code during registration
   */
  static async applyReferralCode(newUserId: string, referralCode: string): Promise<boolean> {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
      select: { id: true },
    });

    if (!referrer) return false;

    // Can't refer yourself
    if (referrer.id === newUserId) return false;

    // Check if user was already referred
    const existing = await prisma.referral.findUnique({
      where: { referredId: newUserId },
    });
    if (existing) return false;

    // Read referral reward from SiteConfig (admin-configurable)
    const REFERRER_REWARD_COINS = await getConfigNumber('referral_reward') || DEFAULT_REFERRER_REWARD;
    const REFERRED_REWARD_COINS = Math.floor(REFERRER_REWARD_COINS / 2); // New user gets half

    // Create referral and reward both users atomically
    await prisma.$transaction(async (tx) => {
      // Link the referral
      await tx.user.update({
        where: { id: newUserId },
        data: { referredById: referrer.id },
      });

      // Create referral record
      await tx.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: newUserId,
          referralCode: referralCode.toUpperCase(),
          referrerReward: REFERRER_REWARD_COINS,
          referredReward: REFERRED_REWARD_COINS,
          isRewarded: true,
        },
      });

      // Reward referrer
      await tx.user.update({
        where: { id: referrer.id },
        data: { coinsBalance: { increment: REFERRER_REWARD_COINS } },
      });

      // Reward new user
      await tx.user.update({
        where: { id: newUserId },
        data: { coinsBalance: { increment: REFERRED_REWARD_COINS } },
      });

      // Create transaction records
      await tx.transaction.create({
        data: {
          userId: referrer.id,
          type: 'PURCHASE',
          amount: REFERRER_REWARD_COINS,
          referenceId: newUserId,
          referenceType: 'referral_reward',
          status: 'COMPLETED',
        },
      });

      await tx.transaction.create({
        data: {
          userId: newUserId,
          type: 'PURCHASE',
          amount: REFERRED_REWARD_COINS,
          referenceId: referrer.id,
          referenceType: 'referral_welcome',
          status: 'COMPLETED',
        },
      });
    });

    // Notify referrer (best effort)
    NotificationService.create({
      userId: referrer.id,
      type: 'referral_success',
      title: 'Referral Reward!',
      body: `Someone joined using your referral code! You earned ${REFERRER_REWARD_COINS} Coins.`,
    }).catch(() => {});

    return true;
  }

  /**
   * Get referral stats for a user
   */
  static async getReferralStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (!user) throw new Error('User not found');

    const [totalReferrals, referrals, totalEarned] = await Promise.all([
      prisma.referral.count({ where: { referrerId: userId } }),
      prisma.referral.findMany({
        where: { referrerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          referred: {
            select: { id: true, name: true, username: true, profileImage: true, createdAt: true },
          },
        },
      }),
      prisma.referral.aggregate({
        where: { referrerId: userId, isRewarded: true },
        _sum: { referrerReward: true },
      }),
    ]);

    // Generate code if user doesn't have one yet
    const referralCode = user.referralCode || await this.getOrCreateReferralCode(userId);
    const currentReward = await getConfigNumber('referral_reward') || DEFAULT_REFERRER_REWARD;

    return {
      referralCode,
      totalReferrals,
      totalEarned: totalEarned._sum.referrerReward || 0,
      rewardPerReferral: currentReward,
      newUserReward: Math.floor(currentReward / 2),
      referrals: referrals.map((r) => ({
        id: r.id,
        user: r.referred,
        reward: r.referrerReward,
        joinedAt: r.createdAt,
      })),
    };
  }
}
