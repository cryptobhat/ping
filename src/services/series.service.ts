import prisma from '../config/database';
import { SeriesStatus, ContentVisibility } from '@prisma/client';
import { toPublicContentListItem } from './content.service';
import { NotificationService } from './notification.service';

const seriesEpisodeContentSelect = {
  id: true,
  title: true,
  description: true,
  coverImage: true,
  contentType: true,
  readTime: true,
  viewCount: true,
  likeCount: true,
  isPremium: true,
  language: true,
  author: { select: { id: true, name: true, username: true, profileImage: true } },
} as const;

interface CreateSeriesData {
  title: string;
  description?: string;
  coverImage?: string;
  language?: string;
  categoryId?: string;
  visibility?: ContentVisibility;
  isPremium?: boolean;
}

interface UpdateSeriesData {
  title?: string;
  description?: string;
  coverImage?: string | null;
  language?: string;
  categoryId?: string;
  status?: SeriesStatus;
  visibility?: ContentVisibility;
  isPremium?: boolean;
}

const seriesInclude = {
  author: {
    select: { id: true, name: true, username: true, profileImage: true, isVerified: true },
  },
  category: { select: { id: true, name: true, slug: true } },
  _count: { select: { items: true, followers: true } },
};

export const seriesService = {
  async create(authorId: string, data: CreateSeriesData) {
    return prisma.series.create({
      data: { authorId, ...data },
      include: seriesInclude,
    });
  },

  async getById(id: string, userId?: string) {
    const series = await prisma.series.findUnique({
      where: { id },
      include: {
        ...seriesInclude,
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            content: {
              select: seriesEpisodeContentSelect,
            },
          },
        },
      },
    });

    if (!series) return null;

    let isFollowing = false;
    if (userId) {
      const follow = await prisma.seriesFollow.findUnique({
        where: { userId_seriesId: { userId, seriesId: id } },
      });
      isFollowing = !!follow;
    }

    const items = series.items.map((item) => ({
      ...item,
      content: item.content
        ? toPublicContentListItem(item.content as unknown as Record<string, unknown>)
        : item.content,
    }));

    return { ...series, items, isFollowing };
  },

  async list(params: {
    page?: number;
    limit?: number;
    language?: string;
    authorId?: string;
    categoryId?: string;
    status?: SeriesStatus;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { visibility: 'PUBLIC' };
    if (params.language) where.language = params.language;
    if (params.authorId) {
      where.authorId = params.authorId;
      // Authors should see their own empty series to add chapters
    } else {
      where.contentCount = { gt: 0 };
    }
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.status) where.status = params.status;

    const [data, total] = await Promise.all([
      prisma.series.findMany({
        where,
        include: seriesInclude,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.series.count({ where }),
    ]);

    return { data, total, page, limit };
  },

  async update(id: string, authorId: string, data: UpdateSeriesData) {
    const series = await prisma.series.findFirst({ where: { id, authorId } });
    if (!series) return null;

    return prisma.series.update({
      where: { id },
      data,
      include: seriesInclude,
    });
  },

  async delete(id: string, authorId: string) {
    const series = await prisma.series.findFirst({ where: { id, authorId } });
    if (!series) return false;

    await prisma.series.delete({ where: { id } });
    return true;
  },

  async addItem(seriesId: string, authorId: string, contentId: string) {
    const series = await prisma.series.findFirst({ where: { id: seriesId, authorId } });
    if (!series) return null;

    const maxOrder = await prisma.seriesItem.findFirst({
      where: { seriesId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const item = await prisma.seriesItem.create({
      data: {
        seriesId,
        contentId,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      },
      include: {
        content: {
          include: {
            author: { select: { id: true, name: true, username: true, profileImage: true } },
          },
        },
      },
    });

    await prisma.series.update({
      where: { id: seriesId },
      data: { contentCount: { increment: 1 } },
    });

    // Fire-and-forget: notify series followers about the new episode
    const episodeTitle = item.content?.title || 'New episode';
    NotificationService.notifySeriesFollowersNewEpisode(
      seriesId,
      episodeTitle,
      contentId
    ).catch(() => {});

    return item;
  },

  async removeItem(seriesId: string, authorId: string, contentId: string) {
    const series = await prisma.series.findFirst({ where: { id: seriesId, authorId } });
    if (!series) return false;

    await prisma.seriesItem.delete({
      where: { seriesId_contentId: { seriesId, contentId } },
    });

    await prisma.series.update({
      where: { id: seriesId },
      data: { contentCount: { decrement: 1 } },
    });

    return true;
  },

  async reorderItems(seriesId: string, authorId: string, itemIds: string[]) {
    const series = await prisma.series.findFirst({ where: { id: seriesId, authorId } });
    if (!series) return false;

    await Promise.all(
      itemIds.map((itemId, index) =>
        prisma.seriesItem.update({
          where: { id: itemId },
          data: { sortOrder: index },
        })
      )
    );

    return true;
  },

  async toggleFollow(seriesId: string, userId: string) {
    const existing = await prisma.seriesFollow.findUnique({
      where: { userId_seriesId: { userId, seriesId } },
    });

    if (existing) {
      await prisma.seriesFollow.delete({ where: { id: existing.id } });
      await prisma.series.update({
        where: { id: seriesId },
        data: { followerCount: { decrement: 1 } },
      });
      return { following: false };
    }

    await prisma.seriesFollow.create({ data: { userId, seriesId } });
    await prisma.series.update({
      where: { id: seriesId },
      data: { followerCount: { increment: 1 } },
    });
    return { following: true };
  },

  async getPopular(language?: string, limit = 10) {
    const where: any = { visibility: 'PUBLIC', contentCount: { gt: 0 } };
    if (language) where.language = language;

    return prisma.series.findMany({
      where,
      include: seriesInclude,
      orderBy: [{ followerCount: 'desc' }, { viewCount: 'desc' }],
      take: limit,
    });
  },
};
