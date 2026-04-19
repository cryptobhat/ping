import prisma from '../../config/database';
import { ContentType } from '@prisma/client';
import { publicContentListSelect, toPublicContentListItem } from '../content.service';
import { TasteProfileService, type UserTasteProfile } from './taste-profile.service';

const W_FOLLOW = parseFloat(process.env.FEED_RANK_FOLLOW_WEIGHT || '18');
const W_AUTHOR = parseFloat(process.env.FEED_RANK_AUTHOR_AFFINITY || '2.5');
const W_CAT = parseFloat(process.env.FEED_RANK_CATEGORY || '1.8');
const W_TYPE = parseFloat(process.env.FEED_RANK_TYPE || '1.4');
const W_TAG = parseFloat(process.env.FEED_RANK_TAG || '1.2');
const W_RECENCY = parseFloat(process.env.FEED_RANK_RECENCY || '8');
const W_ENGAGEMENT = parseFloat(process.env.FEED_RANK_ENGAGEMENT || '1.5');
const W_EXPLORE = parseFloat(process.env.FEED_RANK_EXPLORE_NOISE || '2.2');

const CANDIDATE_CAP = parseInt(process.env.FEED_RANK_CANDIDATE_POOL || '420', 10);

type ContentRow = Record<string, unknown> & {
  id: string;
  authorId: string;
  categoryId: string | null;
  contentType: string;
  likeCount: number;
  publishedAt: Date | null;
  analysis?: { autoTags: string[] } | null;
};

function recencyScore(publishedAt: Date | null): number {
  if (!publishedAt) return 0;
  const days = (Date.now() - publishedAt.getTime()) / (86400 * 1000);
  return Math.exp(-days / 14);
}

function scoreItem(row: ContentRow, taste: UserTasteProfile): number {
  let s = 0;
  if (taste.followedAuthorIds.has(row.authorId)) s += W_FOLLOW;

  const authAff = taste.authorAffinity.get(row.authorId) || 0;
  s += W_AUTHOR * Math.log1p(authAff);

  if (row.categoryId) {
    s += W_CAT * Math.log1p(taste.categoryAffinity.get(row.categoryId) || 0);
  }

  s += W_TYPE * Math.log1p(taste.typeAffinity.get(row.contentType) || 0);

  const tags = row.analysis?.autoTags || [];
  for (const t of tags) {
    s += W_TAG * Math.log1p(taste.tagAffinity.get(t) || 0);
  }

  s += W_RECENCY * recencyScore(row.publishedAt);
  s += W_ENGAGEMENT * Math.log1p(row.likeCount || 0);

  if (W_EXPLORE > 0) {
    s += Math.random() * W_EXPLORE;
  }

  return s;
}

/**
 * Reduce back-to-back repeats from the same author.
 */
function diversifyByAuthor(scored: Array<{ row: ContentRow; score: number }>): ContentRow[] {
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const out: ContentRow[] = [];
  const deferred: typeof scored = [];

  for (const x of sorted) {
    const lastTwo = out.slice(-2);
    const sameCount = lastTwo.filter((r) => r.authorId === x.row.authorId).length;
    if (sameCount >= 2) {
      deferred.push(x);
    } else {
      out.push(x.row);
    }
  }

  for (const x of deferred) {
    out.push(x.row);
  }

  return out;
}

export class FeedRankerService {
  /**
   * Ranked For You: recall diverse candidates, score with taste, diversify, paginate.
   */
  static async getRankedForYou(userId: string, page: number, limit: number) {
    const taste = await TasteProfileService.buildForUser(userId);
    const readIds = [...taste.readContentIds];

    const topAuthors = TasteProfileService.topKeys(taste.authorAffinity, 12);
    const topCategories = TasteProfileService.topKeys(taste.categoryAffinity, 8);
    const topTypeKeys = TasteProfileService.topKeys(taste.typeAffinity, 4);
    const topTypes = topTypeKeys.filter((t): t is ContentType =>
      Object.values(ContentType).includes(t as ContentType)
    );
    const followed = [...taste.followedAuthorIds];

    const baseWhere: Record<string, unknown> = {
      visibility: 'PUBLIC',
      isDraft: false,
      language: taste.preferredLanguage,
    };
    if (readIds.length > 0) {
      baseWhere.id = { notIn: readIds };
    }

    const idSet = new Set<string>();

    const pullIds = async (where: Record<string, unknown>, take: number) => {
      const rows = await prisma.content.findMany({
        where: { ...baseWhere, ...where } as any,
        orderBy: { publishedAt: 'desc' },
        take,
        select: { id: true },
      });
      rows.forEach((r) => idSet.add(r.id));
    };

    if (followed.length > 0) {
      await pullIds({ authorId: { in: followed } }, 140);
    }
    if (topAuthors.length > 0) {
      await pullIds({ authorId: { in: topAuthors } }, 120);
    }
    if (topCategories.length > 0) {
      await pullIds({ categoryId: { in: topCategories } }, 160);
    }
    if (topTypes.length > 0) {
      await pullIds({ contentType: { in: topTypes } }, 140);
    }

    const trending = await prisma.trendingContent.findMany({
      where: {
        timeWindow: 'daily',
        expiresAt: { gte: new Date() },
        content: { visibility: 'PUBLIC', isDraft: false, language: taste.preferredLanguage },
      },
      orderBy: { trendingScore: 'desc' },
      take: 90,
      select: { contentId: true },
    });
    trending.forEach((t) => idSet.add(t.contentId));

    if (idSet.size < 40) {
      const fill = await prisma.content.findMany({
        where: baseWhere,
        orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
        take: 120,
        select: { id: true },
      });
      fill.forEach((r) => idSet.add(r.id));
    }

    const ids = [...idSet].slice(0, CANDIDATE_CAP);
    if (ids.length === 0) {
      return { content: [], total: 0 };
    }

    const rows = await prisma.content.findMany({
      where: { id: { in: ids } },
      select: {
        ...publicContentListSelect,
        analysis: { select: { autoTags: true } },
      },
    });

    const scored = rows.map((row) => ({
      row: row as unknown as ContentRow,
      score: scoreItem(row as unknown as ContentRow, taste),
    }));

    const diversified = diversifyByAuthor(scored);
    const total = diversified.length;
    const skip = (page - 1) * limit;
    const slice = diversified.slice(skip, skip + limit);
    const content = slice.map((row) => {
      const { analysis: _omit, ...rest } = row as ContentRow & { author?: unknown; category?: unknown };
      return toPublicContentListItem(rest as unknown as Record<string, unknown>);
    });

    return { content, total };
  }
}
