import { safeEmit } from "../utils/socket-emit";
import prisma from '../config/database';
import { NotificationService } from './notification.service';
import { getEconomyConfig } from './site-config.service';

export class GiftService {
  static async getAllGifts() {
    return prisma.gift.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  static async sendGift(
    senderId: string,
    receiverId: string,
    giftId: string,
    message?: string
  ) {
    if (senderId === receiverId) {
      throw new Error('Cannot send gift to yourself');
    }

    const gift = await prisma.gift.findUnique({
      where: { id: giftId },
    });

    if (!gift || !gift.isActive) {
      throw new Error('Invalid gift');
    }

    const cfg = await getEconomyConfig();
    const commissionPct = cfg.platform_commission_percent;
    const coinsPerRupee = cfg.coins_per_rupee;
    const authorSharePct = (100 - commissionPct) / 100; // e.g. 0.80
    const authorCreditINR = (gift.penValue / coinsPerRupee) * authorSharePct;

    const result = await prisma.$transaction(async (tx) => {
      // Read balance inside transaction to prevent TOCTOU race conditions
      const sender = await tx.user.findUnique({
        where: { id: senderId },
        select: { coinsBalance: true },
      });

      if (!sender || sender.coinsBalance < gift.penValue) {
        throw new Error('Insufficient coins balance');
      }

      const userGift = await tx.userGift.create({
        data: {
          senderId,
          receiverId,
          giftId,
          message,
          penValue: gift.penValue,
        },
      });

      // Deduct coins from sender
      await tx.user.update({
        where: { id: senderId },
        data: { coinsBalance: { decrement: gift.penValue } },
      });

      // Credit author's wallet balance in INR (80% of gift value by default)
      await tx.user.update({
        where: { id: receiverId },
        data: { walletBalance: { increment: authorCreditINR } },
      });

      // Record transaction for sender
      await tx.transaction.create({
        data: {
          userId: senderId,
          type: 'GIFT_SENT',
          amount: gift.penValue,
          referenceId: userGift.id,
          referenceType: 'user_gift',
          status: 'COMPLETED',
        },
      });

      // Record wallet credit for receiver
      await tx.walletTransaction.create({
        data: {
          userId: receiverId,
          type: 'GIFT',
          amount: authorCreditINR,
          balance: 0,
          description: `Gift received: ${gift.name} (${gift.penValue} Coins, ${commissionPct}% platform fee)`,
          referenceId: userGift.id,
          referenceType: 'gift_received',
        },
      });

      return userGift;
    });

    // Notify receiver
    NotificationService.notifyNewGift(senderId, receiverId, gift.name).catch(() => {});
    safeEmit(receiverId, "gift_received", { giftName: gift.name, senderId });
    safeEmit(senderId, "coins_updated", { coinsBalance: 0 });

    return result;
  }

  static async getReceivedGifts(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [gifts, total] = await Promise.all([
      prisma.userGift.findMany({
        where: { receiverId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: { select: { id: true, username: true, name: true, profileImage: true } },
          gift: true,
        },
      }),
      prisma.userGift.count({ where: { receiverId: userId } }),
    ]);

    return { gifts, total };
  }

  static async getSentGifts(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [gifts, total] = await Promise.all([
      prisma.userGift.findMany({
        where: { senderId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          receiver: { select: { id: true, username: true, name: true, profileImage: true } },
          gift: true,
        },
      }),
      prisma.userGift.count({ where: { senderId: userId } }),
    ]);

    return { gifts, total };
  }
}
