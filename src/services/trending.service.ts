import prisma from '../config/database';
import { publicContentListSelect, toPublicContentListItem } from './content.service';

interface TrendingScore {
  contentId: string;
  trendingScore: number;
  viewVelocity: number;
  engagementRate: number;
  recencyFactor: number;
}

export class TrendingService {
  static async calculateTrendingScore(contentId: string): Promise<TrendingScore> {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: {
        id: true,
        viewCount: true,
        likeCount: true,
        shareCount: true,
        createdAt: true,
      },
    });

    if (!content) {
      throw new Error('Content not found');
    }

    const now = new Date();
    const ageHours = (now.getTime() - content.createdAt.getTime()) / (1000 * 60 * 60);

    const viewVelocity = content.viewCount / Math.max(ageHours, 1);

    const engagementRate = content.viewCount > 0
      ? ((content.likeCount * 2 + content.shareCount * 3) / content.viewCount) * 100
      : 0;

    const recencyFactor = Math.exp(-ageHours / 168); // Decay over a week

    const trendingScore = (viewVelocity * 0.4 + engagementRate * 0.4 + recencyFactor * 100 * 0.2);

    return {
      contentId: content.id,
      trendingScore,
      viewVelocity,
      engagementRate,
      recencyFactor,
    };
  }

  static async calculateAllTrending(timeWindow: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const now = new Date();
    let startDate: Date;

    switch (timeWindow) {
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const content = await prisma.content.findMany({
      where: {
        visibility: 'PUBLIC',
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        viewCount: true,
        likeCount: true,
        shareCount: true,
        createdAt: true,
      },
    });

    // Calculate scores in-memory (no N+1 re-fetching)
    const scores: TrendingScore[] = content.map((item) => {
      const ageHours = (now.getTime() - item.createdAt.getTime()) / (1000 * 60 * 60);
      const viewVelocity = item.viewCount / Math.max(ageHours, 1);
      const engagementRate = item.viewCount > 0
        ? ((item.likeCount * 2 + item.shareCount * 3) / item.viewCount) * 100
        : 0;
      const recencyFactor = Math.exp(-ageHours / 168);
      const trendingScore = (viewVelocity * 0.4 + engagementRate * 0.4 + recencyFactor * 100 * 0.2);

      return { contentId: item.id, trendingScore, viewVelocity, engagementRate, recencyFactor };
    });

    scores.sort((a, b) => b.trendingScore - a.trendingScore);

    const expiresAt = new Date(now.getTime() + (timeWindow === 'daily' ? 24 : timeWindow === 'weekly' ? 168 : 720) * 60 * 60 * 1000);

    // Batch upserts in a single transaction
    await prisma.$transaction(
      scores.map((score, i) =>
        prisma.trendingContent.upsert({
          where: {
            contentId_timeWindow: {
              contentId: score.contentId,
              timeWindow,
            },
          },
          create: {
            contentId: score.contentId,
            trendingScore: score.trendingScore,
            viewVelocity: score.viewVelocity,
            engagementRate: score.engagementRate,
            recencyFactor: score.recencyFactor,
            timeWindow,
            rankPosition: i + 1,
            expiresAt,
          },
          update: {
            trendingScore: score.trendingScore,
            viewVelocity: score.viewVelocity,
            engagementRate: score.engagementRate,
            recencyFactor: score.recencyFactor,
            rankPosition: i + 1,
            calculatedAt: now,
            expiresAt,
          },
        })
      )
    );

    return scores.slice(0, 100);
  }

  static async getTrending(
    timeWindow: 'daily' | 'weekly' | 'monthly' = 'daily',
    page: number = 1,
    limit: number = 20,
    language?: string
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      timeWindow,
      expiresAt: { gte: new Date() },
      ...(language ? { content: { language } } : {}),
    };

    const [trending, total] = await Promise.all([
      prisma.trendingContent.findMany({
        where,
        orderBy: { rankPosition: 'asc' },
        skip,
        take: limit,
        include: {
          content: {
            select: publicContentListSelect,
          },
        },
      }),
      prisma.trendingContent.count({ where }),
    ]);

    return {
      trending: trending.map((t) => ({
        ...toPublicContentListItem(t.content as unknown as Record<string, unknown>),
        trendingScore: t.trendingScore,
        rank: t.rankPosition,
      })),
      total,
    };
  }

  static async getTrendingByCategory(
    categoryId: string,
    timeWindow: 'daily' | 'weekly' | 'monthly' = 'daily',
    limit: number = 10
  ) {
    const trending = await prisma.trendingContent.findMany({
      where: {
        timeWindow,
        expiresAt: { gte: new Date() },
        content: { categoryId },
      },
      orderBy: { rankPosition: 'asc' },
      take: limit,
      include: {
        content: {
          select: publicContentListSelect,
        },
      },
    });

    return trending.map((t) => ({
      ...toPublicContentListItem(t.content as unknown as Record<string, unknown>),
      trendingScore: t.trendingScore,
      rank: t.rankPosition,
    }));
  }

  static async cleanExpiredTrending() {
    await prisma.trendingContent.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }
}