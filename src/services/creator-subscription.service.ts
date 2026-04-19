import prisma from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';

const DEFAULT_COMMISSION = 0.20; // 20% platform cut

async function getPlatformCommission(): Promise<number> {
  try {
    const row = await prisma.siteConfig.findUnique({ where: { key: 'platform_commission_percent' } });
    if (row) {
      const pct = parseFloat(row.value);
      if (!isNaN(pct) && pct >= 0 && pct <= 100) return pct / 100;
    }
  } catch {
    // table may not exist yet during migration — fall back
  }
  return DEFAULT_COMMISSION;
}
const MIN_PRICE = 10;
const MAX_PRICE = 500;
const ELIGIBILITY_VIEWS = 1_000_000;
const ELIGIBILITY_FOLLOWERS = 1_000;
const SUBSCRIPTION_DAYS = 30;

export class CreatorSubscriptionService {
  /**
   * Check if a user qualifies for creator subscriptions.
   * Requirements: 1M+ total content views, 1K+ followers.
   */
  static async checkEligibility(userId: string) {
    const [viewsResult, followersCount, user] = await Promise.all([
      prisma.content.aggregate({
        where: { authorId: userId, isDraft: false },
        _sum: { viewCount: true },
      }),
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { isCreatorEligible: true, creatorPriceINR: true },
      }),
    ]);

    const totalViews = viewsResult._sum.viewCount || 0;
    const eligible = totalViews >= ELIGIBILITY_VIEWS && followersCount >= ELIGIBILITY_FOLLOWERS;

    // Auto-update eligibility flag if it changed
    if (user && user.isCreatorEligible !== eligible) {
      await prisma.user.update({
        where: { id: userId },
        data: { isCreatorEligible: eligible },
      });
    }

    return {
      eligible: eligible || !!user?.isCreatorEligible, // admin override takes precedence
      totalViews,
      followers: followersCount,
      requiredViews: ELIGIBILITY_VIEWS,
      requiredFollowers: ELIGIBILITY_FOLLOWERS,
      currentPriceINR: user?.creatorPriceINR ?? null,
    };
  }

  /**
   * Set the creator's monthly subscription price.
   * Only eligible creators can set a price. Range: 10-500 INR.
   */
  static async setPrice(userId: string, priceINR: number) {
    if (priceINR < MIN_PRICE || priceINR > MAX_PRICE) {
      throw new Error(`Price must be between ${MIN_PRICE} and ${MAX_PRICE} INR`);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isCreatorEligible: true },
    });

    if (!user) throw new Error('User not found');
    if (!user.isCreatorEligible) {
      throw new Error('You are not eligible for creator subscriptions yet');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { creatorPriceINR: Math.round(priceINR), isCreator: true },
      select: { id: true, creatorPriceINR: true, isCreator: true },
    });

    return updated;
  }

  /**
   * Get a creator's subscription profile info (public).
   */
  static async getCreatorProfile(creatorId: string) {
    const [creator, subscriberCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: creatorId },
        select: {
          id: true,
          username: true,
          name: true,
          profileImage: true,
          isCreator: true,
          creatorPriceINR: true,
          isCreatorEligible: true,
        },
      }),
      prisma.creatorSubscription.count({
        where: { creatorId, isActive: true },
      }),
    ]);

    if (!creator) throw new Error('Creator not found');

    return {
      ...creator,
      subscriberCount,
    };
  }

  /**
   * Subscribe to a creator. Deducts from subscriber's wallet balance.
   * Creator receives 80%, platform keeps 20%.
   */
  static async subscribe(subscriberId: string, creatorId: string) {
    if (subscriberId === creatorId) {
      throw new Error('You cannot subscribe to yourself');
    }

    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: { creatorPriceINR: true, isCreator: true, name: true },
    });

    if (!creator || !creator.isCreator || !creator.creatorPriceINR) {
      throw new Error('This user does not offer creator subscriptions');
    }

    // Check if already subscribed (active)
    const existing = await prisma.creatorSubscription.findUnique({
      where: { subscriberId_creatorId: { subscriberId, creatorId } },
    });

    if (existing?.isActive && existing.endDate > new Date()) {
      throw new Error('You are already subscribed to this creator');
    }

    const priceINR = creator.creatorPriceINR;
    const PLATFORM_COMMISSION = await getPlatformCommission();

    // Perform the subscription in a transaction
    return prisma.$transaction(async (tx) => {
      // Check wallet balance
      const subscriber = await tx.user.findUnique({
        where: { id: subscriberId },
        select: { walletBalance: true },
      });

      if (!subscriber) throw new Error('User not found');

      const balance = Number(subscriber.walletBalance);
      if (balance < priceINR) {
        throw new Error(`Insufficient wallet balance. You need ${priceINR} INR but have ${balance.toFixed(2)} INR`);
      }

      // Deduct from subscriber wallet
      const newSubscriberBalance = balance - priceINR;
      await tx.user.update({
        where: { id: subscriberId },
        data: { walletBalance: new Decimal(newSubscriberBalance) },
      });

      // Credit creator (80%)
      const creatorShare = priceINR * (1 - PLATFORM_COMMISSION);
      const creatorUser = await tx.user.findUnique({
        where: { id: creatorId },
        select: { walletBalance: true },
      });
      const newCreatorBalance = Number(creatorUser!.walletBalance) + creatorShare;
      await tx.user.update({
        where: { id: creatorId },
        data: { walletBalance: new Decimal(newCreatorBalance) },
      });

      // Record wallet transactions
      await tx.walletTransaction.create({
        data: {
          userId: subscriberId,
          type: 'CREATOR_SUBSCRIPTION',
          amount: new Decimal(priceINR),
          balance: new Decimal(newSubscriberBalance),
          description: `Subscribed to ${creator.name}`,
          referenceId: creatorId,
          referenceType: 'creator_subscription',
          status: 'completed',
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId: creatorId,
          type: 'CREATOR_EARNING',
          amount: new Decimal(creatorShare),
          balance: new Decimal(newCreatorBalance),
          description: `Subscription earning (${Math.round((1 - PLATFORM_COMMISSION) * 100)}% of ${priceINR} INR)`,
          referenceId: subscriberId,
          referenceType: 'creator_subscription',
          status: 'completed',
        },
      });

      // Create or update subscription record
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);

      const subscription = existing
        ? await tx.creatorSubscription.update({
            where: { id: existing.id },
            data: { priceINR, startDate, endDate, isActive: true },
          })
        : await tx.creatorSubscription.create({
            data: { subscriberId, creatorId, priceINR, startDate, endDate, isActive: true },
          });

      return {
        subscription,
        charged: priceINR,
        creatorReceived: creatorShare,
        newBalance: newSubscriberBalance,
      };
    });
  }

  /**
   * Unsubscribe from a creator (cancel, no refund).
   */
  static async unsubscribe(subscriberId: string, creatorId: string) {
    const existing = await prisma.creatorSubscription.findUnique({
      where: { subscriberId_creatorId: { subscriberId, creatorId } },
    });

    if (!existing || !existing.isActive) {
      throw new Error('No active subscription found');
    }

    await prisma.creatorSubscription.update({
      where: { id: existing.id },
      data: { isActive: false },
    });

    return { message: 'Unsubscribed successfully' };
  }

  /**
   * Check if a user is subscribed to a creator (active + not expired).
   */
  static async isSubscribed(subscriberId: string, creatorId: string): Promise<boolean> {
    if (!subscriberId || !creatorId) return false;

    const sub = await prisma.creatorSubscription.findUnique({
      where: { subscriberId_creatorId: { subscriberId, creatorId } },
    });

    return !!sub && sub.isActive && sub.endDate > new Date();
  }

  /**
   * List subscribers of a creator (paginated).
   */
  static async getSubscribers(creatorId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [subscribers, total] = await Promise.all([
      prisma.creatorSubscription.findMany({
        where: { creatorId, isActive: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          subscriber: {
            select: {
              id: true,
              username: true,
              name: true,
              profileImage: true,
            },
          },
        },
      }),
      prisma.creatorSubscription.count({ where: { creatorId, isActive: true } }),
    ]);

    return {
      subscribers: subscribers.map((s) => ({
        ...s.subscriber,
        subscribedAt: s.startDate,
        expiresAt: s.endDate,
        priceINR: s.priceINR,
      })),
      total,
    };
  }

  /**
   * List creators a user subscribes to (paginated).
   */
  static async getMySubscriptions(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      prisma.creatorSubscription.findMany({
        where: { subscriberId: userId, isActive: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              name: true,
              profileImage: true,
              creatorPriceINR: true,
            },
          },
        },
      }),
      prisma.creatorSubscription.count({ where: { subscriberId: userId, isActive: true } }),
    ]);

    return {
      subscriptions: subscriptions.map((s) => ({
        ...s.creator,
        subscribedAt: s.startDate,
        expiresAt: s.endDate,
        priceINR: s.priceINR,
      })),
      total,
    };
  }

  /**
   * Admin: force-set creator eligibility (override natural check).
   */
  static async adminSetEligibility(userId: string, eligible: boolean) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    return prisma.user.update({
      where: { id: userId },
      data: { isCreatorEligible: eligible },
      select: { id: true, username: true, name: true, isCreatorEligible: true, creatorPriceINR: true },
    });
  }
}
