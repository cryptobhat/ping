import prisma from '../config/database';
import { NotificationService } from './notification.service';
import { SubscriptionService } from './subscription.service';
import { CreatorSubscriptionService } from './creator-subscription.service';
import { scheduleUserInterestRefresh } from './recommendation/interest-refresh';
import { Content, ContentType, ContentVisibility } from '@prisma/client';

const READING_TEASER_MAX = 520;

/** Align with UserService: English `followersCount` / `followingCount` vs Prisma relation names on `Follow`. */
function authorWithPublicCounts<A extends { _count?: { followers: number; following: number } }>(
  author: A | null
): (Omit<A, '_count'> & { followersCount: number; followingCount: number }) | null {
  if (!author) return null;
  const { _count, ...rest } = author;
  return {
    ...(rest as Omit<A, '_count'>),
    followersCount: _count?.following ?? 0,
    followingCount: _count?.followers ?? 0,
  };
}

function readingTeaser(fullBody: string, description?: string | null): string {
  const fromDesc = description?.trim();
  if (fromDesc && fromDesc.length > 0) {
    return fromDesc.length > READING_TEASER_MAX ? `${fromDesc.slice(0, READING_TEASER_MAX).trim()}…` : fromDesc;
  }
  const t = fullBody.trim();
  if (t.length <= READING_TEASER_MAX) return t;
  return `${t.slice(0, READING_TEASER_MAX).trim()}…`;
}

/** List/search responses: no full body (reading only after login on detail). */
export function toPublicContentListItem(row: Record<string, unknown>) {
  const excerpt =
    (typeof row.description === 'string' && row.description.trim()) || '';
  return {
    ...row,
    excerpt,
    likesCount: row.likeCount,
    viewsCount: row.viewCount,
    commentsCount: row.commentCount,
  };
}

/** Feed-style fields only (no full `body` — read detail after login). */
export const publicContentListSelect = {
  id: true,
  authorId: true,
  title: true,
  description: true,
  coverImage: true,
  images: true,
  contentType: true,
  categoryId: true,
  language: true,
  visibility: true,
  isDraft: true,
  publishedAt: true,
  readTime: true,
  viewCount: true,
  likeCount: true,
  shareCount: true,
  commentCount: true,
  bookmarkCount: true,
  favoriteCount: true,
  isFeatured: true,
  isPremium: true,
  membersOnly: true,
  unlockPrice: true,
  allowComments: true,
  audioUrl: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      username: true,
      name: true,
      profileImage: true,
      isPremium: true,
      isCreator: true,
      creatorPriceINR: true,
    },
  },
  category: {
    select: { id: true, name: true, slug: true },
  },
} as const;

interface CreateContentData {
  title?: string;
  body: string;
  contentType: ContentType;
  categoryId?: string;
  visibility: ContentVisibility;
  isPremium?: boolean;
  membersOnly?: boolean;
  coverImage?: string;
  description?: string;
  images?: string[];
  isDraft?: boolean;
  language?: string;
  unlockPrice?: number;
}

interface UpdateContentData {
  title?: string;
  body?: string;
  categoryId?: string;
  visibility?: ContentVisibility;
  isPremium?: boolean;
  membersOnly?: boolean;
  coverImage?: string | null;
  description?: string;
  images?: string[];
  isDraft?: boolean;
  language?: string;
  unlockPrice?: number;
}

interface ContentFilter {
  contentType?: ContentType;
  categoryId?: string;
  authorId?: string;
  visibility?: ContentVisibility;
  search?: string;
  language?: string;
  sort?: 'latest' | 'popular' | 'top_rated';
}

export class ContentService {
  static async createContent(authorId: string, data: CreateContentData): Promise<Content> {
    const wordCount = data.body.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    const content = await prisma.content.create({
      data: {
        ...data,
        authorId,
        readTime,
        publishedAt: data.isDraft ? null : new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
          },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    // Fire-and-forget: notify all followers about the new content
    if (!data.isDraft) {
      NotificationService.notifyFollowersNewContent(
        authorId,
        content.id,
        content.title || 'Untitled',
        data.contentType
      ).catch(() => {});
    }

    return content;
  }

  static async getContentById(
    id: string,
    currentUserId?: string
  ): Promise<Record<string, unknown> | null> {
    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
            isPremium: true,
            isCreator: true,
            creatorPriceINR: true,
            _count: { select: { followers: true, following: true } },
          },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!content) return null;

    if (content.isDraft && content.authorId !== currentUserId) {
      return null;
    }

    // Strict view dedup: 1 user = 1 view EVER (lifetime, not 24hr)
    // Anonymous users don't count views at all
    if (currentUserId) {
      const existingView = await prisma.readingSession.findFirst({
        where: {
          userId: currentUserId,
          contentId: id,
        },
        select: { id: true },
      });

      if (!existingView) {
        await prisma.content.update({
          where: { id },
          data: { viewCount: { increment: 1 } },
        });
      }
    }

    let isLiked = false;
    if (currentUserId) {
      const like = await prisma.like.findUnique({
        where: {
          userId_contentId: {
            userId: currentUserId,
            contentId: id,
          },
        },
      });
      isLiked = !!like;
    }

    const isAuthor = !!currentUserId && content.authorId === currentUserId;
    let readingLocked = false;
    let lockReason: 'login' | 'premium' | 'members_only' | 'coin_unlock' | undefined;
    let bodyOut = content.body;
    let creatorPriceINR: number | null = null;

    if (!isAuthor) {
      if (!currentUserId) {
        readingLocked = true;
        lockReason = 'login';
        bodyOut = readingTeaser(content.body, content.description);
      } else if (content.isPremium) {
        const user = await prisma.user.findUnique({
          where: { id: currentUserId },
          select: { isPremium: true },
        });
        const sub = await SubscriptionService.getCurrentSubscription(currentUserId);
        const hasPremiumAccess = !!(user?.isPremium || sub);
        if (!hasPremiumAccess) {
          readingLocked = true;
          lockReason = 'premium';
          bodyOut = readingTeaser(content.body, content.description);
        }
      }

      // Members-only content: check creator subscription
      if (!readingLocked && (content as any).membersOnly && currentUserId) {
        const isSubscribed = await CreatorSubscriptionService.isSubscribed(currentUserId, content.authorId);
        if (!isSubscribed) {
          readingLocked = true;
          lockReason = 'members_only';
          // Show first 20% as preview
          const previewLength = Math.ceil(content.body.length * 0.2);
          bodyOut = content.body.slice(0, previewLength).trim() + '...';

          // Get creator price for the lock banner
          const authorInfo = await prisma.user.findUnique({
            where: { id: content.authorId },
            select: { creatorPriceINR: true },
          });
          creatorPriceINR = authorInfo?.creatorPriceINR ?? null;
        }
      }

      // Coin-locked content: check if user has paid to unlock
      if (!readingLocked && (content as any).unlockPrice && (content as any).unlockPrice > 0 && currentUserId) {
        const unlocked = await prisma.contentUnlock.findUnique({
          where: { userId_contentId: { userId: currentUserId, contentId: id } },
        });
        if (!unlocked) {
          readingLocked = true;
          lockReason = 'coin_unlock';
          // Show first 20% as preview
          const previewLength = Math.ceil(content.body.length * 0.2);
          bodyOut = content.body.slice(0, previewLength).trim() + '...';
        }
      }
    }

    let isFollowingAuthor = false;
    if (currentUserId && content.authorId !== currentUserId) {
      const followRow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: content.authorId,
          },
        },
        select: { id: true },
      });
      isFollowingAuthor = !!followRow;
    }

    const authorOut = content.author ? authorWithPublicCounts(content.author) : null;

    return {
      ...content,
      author: authorOut
        ? { ...authorOut, isFollowing: isFollowingAuthor }
        : null,
      isFollowingAuthor,
      body: bodyOut,
      readingLocked,
      lockReason,
      creatorPriceINR,
      isLiked,
      unlockPrice: (content as any).unlockPrice ?? null,
    };
  }

  static async updateContent(id: string, authorId: string, data: UpdateContentData): Promise<Content | null> {
    const existing = await prisma.content.findUnique({
      where: { id },
    });

    if (!existing || existing.authorId !== authorId) {
      return null;
    }

    return prisma.content.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });
  }

  static async deleteContent(id: string, authorId: string): Promise<boolean> {
    const existing = await prisma.content.findUnique({
      where: { id },
    });

    if (!existing || existing.authorId !== authorId) {
      return false;
    }

    await prisma.content.delete({ where: { id } });
    return true;
  }

  static async getFeed(page: number, limit: number, filter: ContentFilter, currentUserId?: string) {
    const skip = (page - 1) * limit;

    const where: any = { visibility: 'PUBLIC', isDraft: false, seriesItems: { none: {} } };

    if (filter.contentType) where.contentType = filter.contentType;
    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.authorId) where.authorId = filter.authorId;
    if (filter.language) where.language = filter.language;
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { body: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any;
    switch (filter.sort) {
      case 'popular':
        orderBy = [{ viewCount: 'desc' }, { likeCount: 'desc' }];
        break;
      case 'top_rated':
        orderBy = [{ likeCount: 'desc' }, { shareCount: 'desc' }];
        break;
      case 'latest':
      default:
        orderBy = [{ publishedAt: 'desc' }];
        break;
    }

    const [rows, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: publicContentListSelect,
      }),
      prisma.content.count({ where }),
    ]);

    const content = rows.map((row) => toPublicContentListItem(row as unknown as Record<string, unknown>));

    return { content, total };
  }

  static async toggleLike(contentId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_contentId: { userId, contentId },
      },
    });

    if (existingLike) {
      await prisma.$transaction([
        prisma.like.delete({
          where: { id: existingLike.id },
        }),
        prisma.content.update({
          where: { id: contentId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);

      const content = await prisma.content.findUnique({
        where: { id: contentId },
        select: { likeCount: true },
      });

      return { liked: false, likeCount: content?.likeCount || 0 };
    }

    await prisma.$transaction([
      prisma.like.create({
        data: { userId, contentId },
      }),
      prisma.content.update({
        where: { id: contentId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);

    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { likeCount: true, authorId: true },
    });

    // Notify author (don't notify if liking own content)
    if (content?.authorId && content.authorId !== userId) {
      NotificationService.notifyNewLike(content.authorId, contentId, userId).catch(() => {});
    }

    scheduleUserInterestRefresh(userId);

    return { liked: true, likeCount: content?.likeCount || 0 };
  }

  static async trackShare(contentId: string): Promise<void> {
    await prisma.content.update({
      where: { id: contentId },
      data: { shareCount: { increment: 1 } },
    });
  }

  static async getDrafts(authorId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { authorId, isDraft: true };

    const [content, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.content.count({ where }),
    ]);

    return { content, total };
  }

  static async getSupporters(contentId: string) {
    return prisma.support.findMany({
      where: { contentId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        supporter: {
          select: {
            id: true,
            username: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });
  }
}