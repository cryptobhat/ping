import prisma from '../config/database';
import { scheduleUserInterestRefresh } from './recommendation/interest-refresh';

export class BookmarkService {
  static async addToBookmark(userId: string, contentId: string, collectionName?: string) {
    const existing = await prisma.bookmark.findUnique({
      where: { userId_contentId: { userId, contentId } },
    });

    if (existing) {
      if (collectionName && existing.collectionName !== collectionName) {
        return prisma.bookmark.update({
          where: { id: existing.id },
          data: { collectionName },
        });
      }
      return existing;
    }

    const bookmark = await prisma.$transaction(async (tx) => {
      const b = await tx.bookmark.create({
        data: { userId, contentId, collectionName },
      });

      await tx.content.update({
        where: { id: contentId },
        data: { bookmarkCount: { increment: 1 } },
      });

      return b;
    });

    scheduleUserInterestRefresh(userId);

    return bookmark;
  }

  static async removeFromBookmark(userId: string, contentId: string) {
    const bookmark = await prisma.bookmark.findUnique({
      where: { userId_contentId: { userId, contentId } },
    });

    if (!bookmark) {
      throw new Error('Bookmark not found');
    }

    await prisma.$transaction([
      prisma.bookmark.delete({ where: { id: bookmark.id } }),
      prisma.content.update({
        where: { id: contentId },
        data: { bookmarkCount: { decrement: 1 } },
      }),
    ]);

    return { message: 'Bookmark removed' };
  }

  static async getBookmarks(userId: string, collectionName?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (collectionName) where.collectionName = collectionName;

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where,
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
      prisma.bookmark.count({ where }),
    ]);

    return { bookmarks, total };
  }

  static async getCollections(userId: string) {
    const collections = await prisma.bookmark.groupBy({
      by: ['collectionName'],
      where: { userId, collectionName: { not: null } },
      _count: { id: true },
    });

    return collections.map(c => ({
      name: c.collectionName,
      count: c._count.id,
    }));
  }
}