import prisma from '../config/database';
import { publicContentListSelect, toPublicContentListItem } from './content.service';
import { FeedRankerService } from './recommendation/feed-ranker.service';

export class PersonalizedFeedService {
  /**
   * Get a personalized "For You" feed for a logged-in user.
   * Falls back to trending content when there is insufficient reading history.
   */
  static async getForYouFeed(userId: string, page: number = 1, limit: number = 20) {
    // 1. Gather user's reading history (last 50 sessions)
    const sessions = await prisma.readingSession.findMany({
      where: { userId, durationSeconds: { gte: 15 } },
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        contentId: true,
        isCompleted: true,
        content: {
          select: {
            contentType: true,
            categoryId: true,
            authorId: true,
            language: true,
          },
        },
      },
    });

    // If no history, return trending as fallback
    if (sessions.length < 3) {
      return this.getTrendingFallback(page, limit);
    }

    // Instagram-style: recall + per-user weighted ranking (likes, saves, reads, follows, interests)
    return FeedRankerService.getRankedForYou(userId, page, limit);
  }

  /**
   * Fallback: trending content for anonymous or new users.
   */
  static async getTrendingFallback(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where = { visibility: 'PUBLIC' as const, isDraft: false };

    // Try trending first
    const trending = await prisma.trendingContent.findMany({
      where: {
        timeWindow: 'daily',
        expiresAt: { gte: new Date() },
        content: where,
      },
      orderBy: { trendingScore: 'desc' },
      skip,
      take: limit,
      include: { content: { select: publicContentListSelect } },
    });

    if (trending.length > 0) {
      const content = trending.map((t) =>
        toPublicContentListItem(t.content as unknown as Record<string, unknown>),
      );
      const total = await prisma.trendingContent.count({
        where: { timeWindow: 'daily', expiresAt: { gte: new Date() }, content: where },
      });
      return { content, total };
    }

    // Fallback: latest published content (when trending is empty)
    const [rows, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        select: publicContentListSelect,
      }),
      prisma.content.count({ where }),
    ]);

    const content = rows.map((row) => toPublicContentListItem(row as unknown as Record<string, unknown>));
    return { content, total };
  }
}
