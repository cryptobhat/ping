import prisma from '../config/database';
import { scheduleUserInterestRefresh } from './recommendation/interest-refresh';

export class FavoriteService {
  static async addToFavorites(userId: string, contentId: string) {
    const existing = await prisma.favorite.findUnique({
      where: { userId_contentId: { userId, contentId } },
    });

    if (existing) {
      return existing;
    }

    const favorite = await prisma.$transaction(async (tx) => {
      const f = await tx.favorite.create({
        data: { userId, contentId },
      });

      await tx.content.update({
        where: { id: contentId },
        data: { favoriteCount: { increment: 1 } },
      });

      return f;
    });

    scheduleUserInterestRefresh(userId);

    return favorite;
  }

  static async removeFromFavorites(userId: string, contentId: string) {
    const favorite = await prisma.favorite.findUnique({
      where: { userId_contentId: { userId, contentId } },
    });

    if (!favorite) {
      throw new Error('Favorite not found');
    }

    await prisma.$transaction([
      prisma.favorite.delete({ where: { id: favorite.id } }),
      prisma.content.update({
        where: { id: contentId },
        data: { favoriteCount: { decrement: 1 } },
      }),
    ]);

    return { message: 'Removed from favorites' };
  }

  static async getFavorites(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          content: {
            include: {
              author: { select: { id: true, username: true, name: true, profileImage: true } },
            },
          },
        },
      }),
      prisma.favorite.count({ where: { userId } }),
    ]);

    return { favorites, total };
  }

  static async isFavorited(userId: string, contentId: string): Promise<boolean> {
    const favorite = await prisma.favorite.findUnique({
      where: { userId_contentId: { userId, contentId } },
    });

    return !!favorite;
  }
}