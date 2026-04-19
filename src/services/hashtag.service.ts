import prisma from '../config/database';
import { publicContentListSelect, toPublicContentListItem } from './content.service';
import { ContentVisibility } from '@prisma/client';

export class HashtagService {
  static extractHashtags(text: string): string[] {
    const regex = /#(\w+)/g;
    const matches = text.match(regex);
    if (!matches) return [];
    return [...new Set(matches.map(m => m.slice(1).toLowerCase()))];
  }

  static async linkHashtags(contentId: string, hashtags: string[]) {
    for (const tag of hashtags) {
      let hashtag = await prisma.hashtag.findUnique({
        where: { tag },
      });

      if (!hashtag) {
        hashtag = await prisma.hashtag.create({
          data: { tag, count: 0 },
        });
      }

      await prisma.$transaction([
        prisma.contentHashtag.create({
          data: { contentId, hashtagId: hashtag.id },
        }),
        prisma.hashtag.update({
          where: { id: hashtag.id },
          data: { count: { increment: 1 } },
        }),
      ]);
    }
  }

  static async unlinkHashtags(contentId: string) {
    const contentHashtags = await prisma.contentHashtag.findMany({
      where: { contentId },
    });

    for (const ch of contentHashtags) {
      await prisma.hashtag.update({
        where: { id: ch.hashtagId },
        data: { count: { decrement: 1 } },
      });
    }

    await prisma.contentHashtag.deleteMany({
      where: { contentId },
    });
  }

  static async getTrendingHashtags(limit: number = 10) {
    return prisma.hashtag.findMany({
      where: {
        isTrending: true,
        count: { gte: 10 },
      },
      orderBy: { count: 'desc' },
      take: limit,
    });
  }

  static async getContentByHashtag(tag: string, page: number = 1, limit: number = 20, language?: string) {
    const skip = (page - 1) * limit;

    const hashtag = await prisma.hashtag.findUnique({
      where: { tag: tag.toLowerCase() },
    });

    if (!hashtag) {
      return { content: [], total: 0 };
    }

    const contentIds = await prisma.contentHashtag.findMany({
      where: { hashtagId: hashtag.id },
      select: { contentId: true },
    });

    const where: any = {
      id: { in: contentIds.map(c => c.contentId) },
      visibility: 'PUBLIC' as ContentVisibility,
      isDraft: false,
      ...(language ? { language } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: publicContentListSelect,
      }),
      prisma.content.count({ where }),
    ]);

    const content = rows.map((row) => toPublicContentListItem(row as unknown as Record<string, unknown>));

    return { content, total };
  }

  static async updateTrendingHashtags() {
    const trendingThreshold = 50;

    await prisma.hashtag.updateMany({
      where: { count: { gte: trendingThreshold } },
      data: { isTrending: true },
    });

    await prisma.hashtag.updateMany({
      where: { count: { lt: trendingThreshold } },
      data: { isTrending: false },
    });
  }
}