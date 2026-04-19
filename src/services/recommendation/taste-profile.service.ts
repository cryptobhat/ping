import prisma from '../../config/database';
import { ContentType } from '@prisma/client';

/** Half-life for exponential recency decay (days). */
const RECENCY_HALF_LIFE_DAYS = parseFloat(process.env.TASTE_RECENCY_HALF_LIFE_DAYS || '21');

function recencyMultiplier(createdAt: Date): number {
  const ageMs = Date.now() - createdAt.getTime();
  const days = ageMs / (86400 * 1000);
  return Math.pow(0.5, days / RECENCY_HALF_LIFE_DAYS);
}

function addTo(map: Map<string, number>, key: string | null | undefined, delta: number): void {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + delta);
}

export type UserTasteProfile = {
  userId: string;
  readContentIds: Set<string>;
  preferredLanguage: string;
  authorAffinity: Map<string, number>;
  categoryAffinity: Map<string, number>;
  typeAffinity: Map<string, number>;
  tagAffinity: Map<string, number>;
  followedAuthorIds: Set<string>;
  /** Cumulative reading time per author in minutes. */
  readTimeByAuthor: Map<string, number>;
  /** From persisted UserInterest (JSON arrays). */
  interestTags: Set<string>;
  interestTypes: Set<string>;
  interestAuthors: Set<string>;
};

/**
 * Unified implicit + explicit taste signals for feed ranking and notifications.
 */
export class TasteProfileService {
  static async buildForUser(userId: string): Promise<UserTasteProfile> {
    const authorAffinity = new Map<string, number>();
    const categoryAffinity = new Map<string, number>();
    const typeAffinity = new Map<string, number>();
    const tagAffinity = new Map<string, number>();
    const readContentIds = new Set<string>();
    const langFreq: Record<string, number> = {};
    const readTimeByAuthor = new Map<string, number>();

    const sessions = await prisma.readingSession.findMany({
      where: { userId, durationSeconds: { gte: 15 } },
      take: 80,
      orderBy: { createdAt: 'desc' },
      select: {
        contentId: true,
        isCompleted: true,
        durationSeconds: true,
        createdAt: true,
        content: {
          select: {
            authorId: true,
            categoryId: true,
            contentType: true,
            language: true,
            analysis: { select: { autoTags: true } },
          },
        },
      },
    });

    for (const s of sessions) {
      readContentIds.add(s.contentId);
      const rc = recencyMultiplier(s.createdAt);
      const durBoost = Math.min(2, 1 + s.durationSeconds / 180);
      const completeBoost = s.isCompleted ? 2 : 1;
      const w = rc * durBoost * completeBoost;

      const c = s.content;
      addTo(authorAffinity, c.authorId, w);
      // Accumulate reading time in minutes per author
      if (c.authorId) {
        const prevMin = readTimeByAuthor.get(c.authorId) || 0;
        readTimeByAuthor.set(c.authorId, prevMin + s.durationSeconds / 60);
      }
      addTo(categoryAffinity, c.categoryId, w * 1.2);
      addTo(typeAffinity, c.contentType, w);
      langFreq[c.language] = (langFreq[c.language] || 0) + w;
      if (c.analysis?.autoTags) {
        for (const t of c.analysis.autoTags) {
          tagAffinity.set(t, (tagAffinity.get(t) || 0) + w * 0.8);
        }
      }
    }

    const likes = await prisma.like.findMany({
      where: { userId },
      take: 100,
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        content: {
          select: {
            authorId: true,
            categoryId: true,
            contentType: true,
            analysis: { select: { autoTags: true } },
          },
        },
      },
    });

    for (const l of likes) {
      const rc = recencyMultiplier(l.createdAt);
      const w = 4 * rc;
      const c = l.content;
      addTo(authorAffinity, c.authorId, w);
      addTo(categoryAffinity, c.categoryId, w * 1.1);
      addTo(typeAffinity, c.contentType, w);
      if (c.analysis?.autoTags) {
        for (const t of c.analysis.autoTags) {
          tagAffinity.set(t, (tagAffinity.get(t) || 0) + w * 0.9);
        }
      }
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      take: 80,
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        content: {
          select: {
            authorId: true,
            categoryId: true,
            contentType: true,
            analysis: { select: { autoTags: true } },
          },
        },
      },
    });

    for (const b of bookmarks) {
      const rc = recencyMultiplier(b.createdAt);
      const w = 5 * rc;
      const c = b.content;
      addTo(authorAffinity, c.authorId, w);
      addTo(categoryAffinity, c.categoryId, w * 1.15);
      addTo(typeAffinity, c.contentType, w);
      if (c.analysis?.autoTags) {
        for (const t of c.analysis.autoTags) {
          tagAffinity.set(t, (tagAffinity.get(t) || 0) + w);
        }
      }
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      take: 80,
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        content: {
          select: {
            authorId: true,
            categoryId: true,
            contentType: true,
            analysis: { select: { autoTags: true } },
          },
        },
      },
    });

    for (const f of favorites) {
      const rc = recencyMultiplier(f.createdAt);
      const w = 5 * rc;
      const c = f.content;
      addTo(authorAffinity, c.authorId, w);
      addTo(categoryAffinity, c.categoryId, w * 1.15);
      addTo(typeAffinity, c.contentType, w);
      if (c.analysis?.autoTags) {
        for (const t of c.analysis.autoTags) {
          tagAffinity.set(t, (tagAffinity.get(t) || 0) + w);
        }
      }
    }

    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followedAuthorIds = new Set(follows.map((f) => f.followingId));
    for (const fid of followedAuthorIds) {
      authorAffinity.set(fid, (authorAffinity.get(fid) || 0) + 6);
    }

    const interestTags = new Set<string>();
    const interestTypes = new Set<string>();
    const interestAuthors = new Set<string>();

    const ui = await prisma.userInterest.findUnique({ where: { userId } });
    if (ui) {
      const tags = (ui.interestTags as string[]) || [];
      tags.forEach((t) => interestTags.add(t));
      const types = (ui.preferredContentTypes as string[]) || [];
      types.forEach((t) => interestTypes.add(t));
      ui.preferredAuthors.forEach((a) => interestAuthors.add(a));

      for (const t of tags) {
        tagAffinity.set(t, (tagAffinity.get(t) || 0) + 2);
      }
      for (const ct of types) {
        addTo(typeAffinity, ct as ContentType, 3);
      }
      for (const aid of ui.preferredAuthors) {
        addTo(authorAffinity, aid, 4);
      }
    }

    let preferredLanguage = 'kn';
    const langEntries = Object.entries(langFreq).sort((a, b) => b[1] - a[1]);
    if (langEntries.length > 0) preferredLanguage = langEntries[0][0];

    return {
      userId,
      readContentIds,
      readTimeByAuthor,
      preferredLanguage,
      authorAffinity,
      categoryAffinity,
      typeAffinity,
      tagAffinity,
      followedAuthorIds,
      interestTags,
      interestTypes,
      interestAuthors,
    };
  }

  /** Top K keys by affinity value. */
  static topKeys(map: Map<string, number>, k: number): string[] {
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, k)
      .map(([key]) => key);
  }
}
