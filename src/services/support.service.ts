import prisma from '../config/database';

export class SupportService {
  static async supportCreator(
    supporterId: string,
    receiverId: string,
    coins: number,
    contentId?: string,
    message?: string
  ) {
    if (supporterId === receiverId) {
      throw new Error('Cannot support yourself');
    }

    const supporter = await prisma.user.findUnique({
      where: { id: supporterId },
      select: { coinsBalance: true },
    });

    if (!supporter || supporter.coinsBalance < coins) {
      throw new Error('Insufficient coins balance');
    }

    const result = await prisma.$transaction(async (tx) => {
      const support = await tx.support.create({
        data: {
          supporterId,
          receiverId,
          coins,
          contentId,
          message,
        },
      });

      await tx.user.update({
        where: { id: supporterId },
        data: { coinsBalance: { decrement: coins } },
      });

      await tx.user.update({
        where: { id: receiverId },
        data: { coinsBalance: { increment: coins } },
      });

      await tx.transaction.create({
        data: {
          userId: supporterId,
          type: 'SUPPORT',
          amount: coins,
          referenceId: support.id,
          referenceType: 'support',
          status: 'COMPLETED',
        },
      });

      return support;
    });

    return result;
  }

  static async getSupportHistory(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [supports, total] = await Promise.all([
      prisma.support.findMany({
        where: { supporterId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          receiver: { select: { id: true, username: true, name: true, profileImage: true } },
          content: { select: { id: true, title: true } },
        },
      }),
      prisma.support.count({ where: { supporterId: userId } }),
    ]);

    return { supports, total };
  }

  static async getReceivedSupports(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [supports, total] = await Promise.all([
      prisma.support.findMany({
        where: { receiverId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          supporter: { select: { id: true, username: true, name: true, profileImage: true } },
          content: { select: { id: true, title: true } },
        },
      }),
      prisma.support.count({ where: { receiverId: userId } }),
    ]);

    return { supports, total };
  }
}