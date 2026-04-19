import prisma from '../config/database';
import { Prisma } from '@prisma/client';

interface LeaderboardUser {
  rank: number;
  user: {
    id: string;
    name: string;
    username: string;
    profileImage: string | null;
    isVerified: boolean;
  };
  stats: {
    views: number;
    followers: number;
    contentCount: number;
    likes: number;
    earnings?: number;
  };
}

const userSelect = {
  id: true,
  name: true,
  username: true,
  profileImage: true,
  isVerified: true,
} satisfies Prisma.UserSelect;

export class LeaderboardService {
  /**
   * Top writers by aggregate content views + likes + follower count.
   */
  static async getTopWriters(limit: number = 20, language?: string, period?: 'today' | 'week' | 'month'): Promise<LeaderboardUser[]> {
    // Get users who have published content, aggregated by views + likes
    const contentWhere: Prisma.ContentWhereInput = {
      visibility: 'PUBLIC',
      isDraft: false,
      ...(language ? { language } : {}),
    };

    if (period === 'today') {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      contentWhere.createdAt = { gte: todayStart };
    } else if (period === 'week') {
      contentWhere.createdAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (period === 'month') {
      contentWhere.createdAt = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

    const authorStats = await prisma.content.groupBy({
      by: ['authorId'],
      where: contentWhere,
      _sum: { viewCount: true, likeCount: true },
      _count: { id: true },
      orderBy: { _sum: { viewCount: 'desc' } },
      take: limit * 2, // fetch extra to account for inactive users
    });

    if (authorStats.length === 0) return [];

    const userIds = authorStats.map((s) => s.authorId);

    // Fetch user details + follower counts in parallel
    const [users, followerCounts] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds }, isActive: true },
        select: userSelect,
      }),
      prisma.follow.groupBy({
        by: ['followingId'],
        where: { followingId: { in: userIds } },
        _count: { id: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const followerMap = new Map(followerCounts.map((f) => [f.followingId, f._count.id]));

    // Score: views * 1 + likes * 5 + followers * 10
    const scored = authorStats
      .filter((s) => userMap.has(s.authorId))
      .map((s) => {
        const views = s._sum.viewCount || 0;
        const likes = s._sum.likeCount || 0;
        const followers = followerMap.get(s.authorId) || 0;
        const score = views + likes * 5 + followers * 10;
        return {
          authorId: s.authorId,
          views,
          likes,
          contentCount: s._count.id,
          followers,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map((s, i) => ({
      rank: i + 1,
      user: userMap.get(s.authorId)!,
      stats: {
        views: s.views,
        followers: s.followers,
        contentCount: s.contentCount,
        likes: s.likes,
      },
    }));
  }

  /**
   * Top earners by total wallet credits (CREDIT transactions only).
   */
  static async getTopEarners(limit: number = 20): Promise<LeaderboardUser[]> {
    // Aggregate credit transactions per user
    const earnerStats = await prisma.walletTransaction.groupBy({
      by: ['userId'],
      where: { type: 'CREDIT', status: 'completed' },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit * 2,
    });

    if (earnerStats.length === 0) return [];

    const userIds = earnerStats.map((s) => s.userId);

    const [users, contentCounts, followerCounts] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds }, isActive: true },
        select: userSelect,
      }),
      prisma.content.groupBy({
        by: ['authorId'],
        where: { authorId: { in: userIds }, visibility: 'PUBLIC', isDraft: false },
        _count: { id: true },
        _sum: { viewCount: true },
      }),
      prisma.follow.groupBy({
        by: ['followingId'],
        where: { followingId: { in: userIds } },
        _count: { id: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const contentMap = new Map(contentCounts.map((c) => [c.authorId, c]));
    const followerMap = new Map(followerCounts.map((f) => [f.followingId, f._count.id]));

    const results = earnerStats
      .filter((s) => userMap.has(s.userId))
      .slice(0, limit);

    return results.map((s, i) => {
      const cStats = contentMap.get(s.userId);
      return {
        rank: i + 1,
        user: userMap.get(s.userId)!,
        stats: {
          views: cStats?._sum.viewCount || 0,
          followers: followerMap.get(s.userId) || 0,
          contentCount: cStats?._count.id || 0,
          likes: 0,
          earnings: Number(s._sum.amount || 0),
        },
      };
    });
  }

  /**
   * Weekly stars — writers with most views in the last 7 days.
   */
  static async getWeeklyStars(limit: number = 20, language?: string): Promise<LeaderboardUser[]> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get reading sessions from the past week grouped by content author
    // Alternatively, we look at content published or heavily viewed this week
    // We'll use content viewCount on recently active content
    const contentWhere: Prisma.ContentWhereInput = {
      visibility: 'PUBLIC',
      isDraft: false,
      updatedAt: { gte: weekAgo },
      ...(language ? { language } : {}),
    };

    const authorStats = await prisma.content.groupBy({
      by: ['authorId'],
      where: contentWhere,
      _sum: { viewCount: true, likeCount: true },
      _count: { id: true },
      orderBy: { _sum: { viewCount: 'desc' } },
      take: limit * 2,
    });

    if (authorStats.length === 0) return [];

    const userIds = authorStats.map((s) => s.authorId);

    const [users, followerCounts] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds }, isActive: true },
        select: userSelect,
      }),
      prisma.follow.groupBy({
        by: ['followingId'],
        where: { followingId: { in: userIds } },
        _count: { id: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const followerMap = new Map(followerCounts.map((f) => [f.followingId, f._count.id]));

    const results = authorStats
      .filter((s) => userMap.has(s.authorId))
      .slice(0, limit);

    return results.map((s, i) => ({
      rank: i + 1,
      user: userMap.get(s.authorId)!,
      stats: {
        views: s._sum.viewCount || 0,
        followers: followerMap.get(s.authorId) || 0,
        contentCount: s._count.id,
        likes: s._sum.likeCount || 0,
      },
    }));
  }

  /**
   * Rising authors — new users (joined last 30 days) with best engagement.
   */
  static async getRisingAuthors(limit: number = 20, language?: string): Promise<LeaderboardUser[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Find new users who have published content
    const newAuthors = await prisma.user.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        isActive: true,
        content: {
          some: {
            visibility: 'PUBLIC',
            isDraft: false,
            ...(language ? { language } : {}),
          },
        },
      },
      select: {
        ...userSelect,
        bio: true,
        createdAt: true,
        _count: { select: { following: true } },
      },
      take: limit * 3,
    });

    if (newAuthors.length === 0) return [];

    const userIds = newAuthors.map((u) => u.id);

    // Get content stats for these authors
    const contentWhere: Prisma.ContentWhereInput = {
      authorId: { in: userIds },
      visibility: 'PUBLIC',
      isDraft: false,
      ...(language ? { language } : {}),
    };

    const contentStats = await prisma.content.groupBy({
      by: ['authorId'],
      where: contentWhere,
      _sum: { viewCount: true, likeCount: true },
      _count: { id: true },
    });

    const statsMap = new Map(contentStats.map((s) => [s.authorId, s]));

    const scored = newAuthors
      .map((u) => {
        const s = statsMap.get(u.id);
        const views = s?._sum.viewCount || 0;
        const likes = s?._sum.likeCount || 0;
        const followers = u._count.following;
        const contentCount = s?._count.id || 0;
        // Score new authors with emphasis on engagement rate
        const score = views + likes * 10 + followers * 20;
        return { user: u, views, likes, followers, contentCount, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map((s, i) => ({
      rank: i + 1,
      user: {
        id: s.user.id,
        name: s.user.name,
        username: s.user.username,
        profileImage: s.user.profileImage,
        isVerified: s.user.isVerified,
        bio: (s.user as any).bio || null,
      },
      stats: {
        views: s.views,
        followers: s.followers,
        contentCount: s.contentCount,
        likes: s.likes,
        joinedDaysAgo: Math.ceil((Date.now() - (s.user as any).createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      },
    }));
  }
}
