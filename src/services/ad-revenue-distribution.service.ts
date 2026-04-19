import prisma from '../config/database';
import { Prisma } from '@prisma/client';

/**
 * Ad revenue share: 10% of verified gross ad revenue is the platform pool.
 * Of that pool: 35% → eligible readers (by fair reading time), 65% → authors (by monthly engagement).
 * Anti-abuse: session caps, daily reader caps, min qualified minutes, per-recipient caps, idempotent monthly run.
 */
export const AD_SHARE_PROGRAM = {
  PLATFORM_POOL_OF_GROSS: 0.1,
  READER_SHARE_OF_PLATFORM_POOL: 0.35,
  AUTHOR_SHARE_OF_PLATFORM_POOL: 0.65,
  FORMULA_VERSION: 1,
  MIN_READER_QUALIFIED_MINUTES: 30,
  MAX_SESSION_MINUTES: 45,
  MAX_READER_MINUTES_PER_DAY: 120,
  READER_MAX_FRACTION_OF_READER_POOL: 0.02,
  AUTHOR_MAX_FRACTION_OF_AUTHOR_POOL: 0.05,
  MIN_PAYOUT_INR: 1,
  W_READER_MINUTE: 1,
  W_READER_COMPLETE: 5,
  W_READER_STREAK: 25,
  W_AUTHOR_CONTENT_MINUTE: 1,
  W_AUTHOR_LIKE: 3,
  W_AUTHOR_COMMENT: 2,
  REF_TYPE_READER: 'ad_revenue_share_reader',
  REF_TYPE_AUTHOR: 'ad_revenue_share_author',
} as const;

function d(n: number): Prisma.Decimal {
  return new Prisma.Decimal(Math.round(n * 100) / 100);
}

function monthBounds(monthKey: string): { start: Date; endExclusive: Date; key: string } {
  const m = /^(\d{4})-(\d{2})$/.exec(monthKey.trim());
  if (!m) throw new Error('month must be YYYY-MM');
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) throw new Error('Invalid month');
  const start = new Date(Date.UTC(y, mo - 1, 1, 0, 0, 0, 0));
  const endExclusive = new Date(Date.UTC(y, mo, 1, 0, 0, 0, 0));
  return { start, endExclusive, key: `${y}-${String(mo).padStart(2, '0')}` };
}

function dayKeyUTC(dt: Date): string {
  return dt.toISOString().slice(0, 10);
}

/** Proportional split with hard per-recipient cap; surplus redistributed in rounds. */
function allocateWithCapFraction(
  ids: string[],
  weights: number[],
  pool: number,
  maxFractionOfPool: number
): Map<string, number> {
  const result = new Map<string, number>();
  ids.forEach((id) => result.set(id, 0));
  if (pool <= 0 || ids.length === 0) return result;

  const w = weights.map((x) => Math.max(0, x));
  const sumW = w.reduce((a, b) => a + b, 0);
  if (sumW <= 0) return result;

  const cap = pool * maxFractionOfPool;
  let amounts = w.map((wi) => (wi / sumW) * pool);

  for (let iter = 0; iter < 20; iter++) {
    amounts = amounts.map((a) => Math.min(a, cap));
    const total = amounts.reduce((x, y) => x + y, 0);
    const surplus = pool - total;
    if (surplus <= 0.005) break;

    const room = amounts.map((a, i) => ({
      i,
      room: Math.max(0, cap - a),
      wi: w[i],
    }));
    const eligible = room.filter((r) => r.room > 1e-9 && r.wi > 0);
    if (eligible.length === 0) break;
    const sw = eligible.reduce((s, r) => s + r.wi, 0);
    for (const r of eligible) {
      amounts[r.i] += (r.wi / sw) * surplus;
    }
  }

  amounts = amounts.map((a) => Math.min(a, cap));
  ids.forEach((id, i) => result.set(id, amounts[i]));
  return result;
}

async function loadSessionsInMonth(start: Date, endExclusive: Date) {
  return prisma.readingSession.findMany({
    where: {
      createdAt: { gte: start, lt: endExclusive },
    },
    select: {
      userId: true,
      contentId: true,
      createdAt: true,
      durationSeconds: true,
      isCompleted: true,
    },
  });
}

/**
 * Per user: qualified minutes (sum of capped per-day totals).
 * Per content: qualified minutes from proportional split when a user's day exceeds the daily cap.
 */
function aggregateReadingForDistribution(
  sessions: Awaited<ReturnType<typeof loadSessionsInMonth>>,
  maxSessionSec: number,
  maxDayUserSec: number
) {
  const userDayContent = new Map<string, number>();

  for (const s of sessions) {
    const day = dayKeyUTC(s.createdAt);
    const add = Math.min(Math.max(0, s.durationSeconds), maxSessionSec);
    const k = `${s.userId}\t${day}\t${s.contentId}`;
    userDayContent.set(k, (userDayContent.get(k) || 0) + add);
  }

  const qualifiedMinutesByUser = new Map<string, number>();
  const qualifiedMinutesByContent = new Map<string, number>();
  const completesByUser = new Map<string, number>();

  const byUserDay = new Map<string, Map<string, number>>();
  for (const [k, sec] of userDayContent) {
    const [uid, day, contentId] = k.split('\t');
    const ud = `${uid}\t${day}`;
    if (!byUserDay.has(ud)) byUserDay.set(ud, new Map());
    byUserDay.get(ud)!.set(contentId, sec);
  }

  for (const [ud, contentMap] of byUserDay) {
    const dayRaw = [...contentMap.values()].reduce((a, b) => a + b, 0);
    const scale = dayRaw > 0 ? Math.min(1, maxDayUserSec / dayRaw) : 0;
    const uid = ud.split('\t')[0];

    for (const [contentId, rawSec] of contentMap) {
      const attributedSec = rawSec * scale;
      qualifiedMinutesByContent.set(
        contentId,
        (qualifiedMinutesByContent.get(contentId) || 0) + attributedSec / 60
      );
      qualifiedMinutesByUser.set(
        uid,
        (qualifiedMinutesByUser.get(uid) || 0) + attributedSec / 60
      );
    }
  }

  for (const s of sessions) {
    if (s.isCompleted) {
      completesByUser.set(s.userId, (completesByUser.get(s.userId) || 0) + 1);
    }
  }

  return { qualifiedMinutesByUser, qualifiedMinutesByContent, completesByUser };
}

export const adRevenueDistributionService = {
  program: AD_SHARE_PROGRAM,

  async preview(totalAdRevenue: number, monthInput: string) {
    const { start, endExclusive, key } = monthBounds(monthInput);
    const gross = Math.max(0, totalAdRevenue);
    const platformPool = gross * AD_SHARE_PROGRAM.PLATFORM_POOL_OF_GROSS;
    const readerPool = platformPool * AD_SHARE_PROGRAM.READER_SHARE_OF_PLATFORM_POOL;
    const authorPool = platformPool * AD_SHARE_PROGRAM.AUTHOR_SHARE_OF_PLATFORM_POOL;

    const sessions = await loadSessionsInMonth(start, endExclusive);
    const agg = aggregateReadingForDistribution(
      sessions,
      AD_SHARE_PROGRAM.MAX_SESSION_MINUTES * 60,
      AD_SHARE_PROGRAM.MAX_READER_MINUTES_PER_DAY * 60
    );

    const readerUserIds = [...agg.qualifiedMinutesByUser.keys()];
    const users = await prisma.user.findMany({
      where: { id: { in: readerUserIds } },
      select: { id: true, isPremium: true, isActive: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const statsList = await prisma.readingStats.findMany({
      where: { userId: { in: readerUserIds } },
      select: { userId: true, currentStreakDays: true },
    });
    const streakMap = new Map(statsList.map((s) => [s.userId, s.currentStreakDays]));

    const readerScores: { userId: string; weight: number; qualifiedMinutes: number; completes: number; streakBonus: boolean }[] = [];

    for (const [userId, qMin] of agg.qualifiedMinutesByUser) {
      if (qMin < AD_SHARE_PROGRAM.MIN_READER_QUALIFIED_MINUTES) continue;
      const u = userMap.get(userId);
      if (!u || !u.isActive || u.isPremium) continue;

      const completes = agg.completesByUser.get(userId) || 0;
      const streak = (streakMap.get(userId) || 0) >= 7;
      const weight =
        qMin * AD_SHARE_PROGRAM.W_READER_MINUTE +
        completes * AD_SHARE_PROGRAM.W_READER_COMPLETE +
        (streak ? AD_SHARE_PROGRAM.W_READER_STREAK : 0);

      if (weight <= 0) continue;
      readerScores.push({
        userId,
        weight,
        qualifiedMinutes: Math.round(qMin * 10) / 10,
        completes,
        streakBonus: streak,
      });
    }

    const readerPayouts = allocateWithCapFraction(
      readerScores.map((r) => r.userId),
      readerScores.map((r) => r.weight),
      readerPool,
      AD_SHARE_PROGRAM.READER_MAX_FRACTION_OF_READER_POOL
    );

    const readerRows = readerScores
      .map((r) => ({
        userId: r.userId,
        qualifiedMinutes: r.qualifiedMinutes,
        completes: r.completes,
        streakBonus: r.streakBonus,
        weight: r.weight,
        amount: Math.round((readerPayouts.get(r.userId) || 0) * 100) / 100,
      }))
      .filter((x) => x.amount >= AD_SHARE_PROGRAM.MIN_PAYOUT_INR)
      .sort((a, b) => b.amount - a.amount);

    const [likesByContent, commentsByContent] = await Promise.all([
      prisma.like.groupBy({
        by: ['contentId'],
        where: { createdAt: { gte: start, lt: endExclusive } },
        _count: { _all: true },
      }),
      prisma.comment.groupBy({
        by: ['contentId'],
        where: { createdAt: { gte: start, lt: endExclusive } },
        _count: { _all: true },
      }),
    ]);

    const likesMap = new Map(likesByContent.map((x) => [x.contentId, x._count._all]));
    const commentsMap = new Map(commentsByContent.map((x) => [x.contentId, x._count._all]));

    const contents = await prisma.content.findMany({
      where: {
        isDraft: false,
        visibility: 'PUBLIC',
        id: { in: [...new Set([...agg.qualifiedMinutesByContent.keys(), ...likesMap.keys(), ...commentsMap.keys()])] },
      },
      select: { id: true, authorId: true, title: true },
    });

    const contentScore = new Map<string, number>();
    for (const c of contents) {
      const mins = agg.qualifiedMinutesByContent.get(c.id) || 0;
      const lk = likesMap.get(c.id) || 0;
      const cm = commentsMap.get(c.id) || 0;
      const score =
        mins * AD_SHARE_PROGRAM.W_AUTHOR_CONTENT_MINUTE +
        lk * AD_SHARE_PROGRAM.W_AUTHOR_LIKE +
        cm * AD_SHARE_PROGRAM.W_AUTHOR_COMMENT;
      if (score > 0) contentScore.set(c.id, score);
    }

    const authorWeight = new Map<string, number>();
    for (const c of contents) {
      const sc = contentScore.get(c.id);
      if (!sc) continue;
      authorWeight.set(c.authorId, (authorWeight.get(c.authorId) || 0) + sc);
    }

    const authorIds = [...authorWeight.keys()];
    const authorUsers = await prisma.user.findMany({
      where: { id: { in: authorIds }, isActive: true },
      select: { id: true, username: true, name: true },
    });
    const authorName = new Map(authorUsers.map((u) => [u.id, u]));

    const weights = authorIds.map((id) => authorWeight.get(id) || 0);
    const authorPayouts = allocateWithCapFraction(
      authorIds,
      weights,
      authorPool,
      AD_SHARE_PROGRAM.AUTHOR_MAX_FRACTION_OF_AUTHOR_POOL
    );

    const authorRows = authorIds
      .map((id) => ({
        authorId: id,
        username: authorName.get(id)?.username,
        name: authorName.get(id)?.name,
        weight: authorWeight.get(id) || 0,
        amount: Math.round((authorPayouts.get(id) || 0) * 100) / 100,
      }))
      .filter((x) => x.amount >= AD_SHARE_PROGRAM.MIN_PAYOUT_INR)
      .sort((a, b) => b.amount - a.amount);

    const totalReader = readerRows.reduce((s, r) => s + r.amount, 0);
    const totalAuthor = authorRows.reduce((s, r) => s + r.amount, 0);

    const existing = await prisma.adRevenueDistributionRun.findUnique({ where: { month: key } });

    return {
      month: key,
      grossAdRevenue: gross,
      platformPoolPct: AD_SHARE_PROGRAM.PLATFORM_POOL_OF_GROSS,
      platformPool,
      readerPool,
      authorPool,
      readerPoolRatio: AD_SHARE_PROGRAM.READER_SHARE_OF_PLATFORM_POOL,
      authorPoolRatio: AD_SHARE_PROGRAM.AUTHOR_SHARE_OF_PLATFORM_POOL,
      formulaVersion: AD_SHARE_PROGRAM.FORMULA_VERSION,
      readerRecipients: readerRows.length,
      authorRecipients: authorRows.length,
      totalReaderPayout: Math.round(totalReader * 100) / 100,
      totalAuthorPayout: Math.round(totalAuthor * 100) / 100,
      unallocatedReaderPool: Math.round((readerPool - totalReader) * 100) / 100,
      unallocatedAuthorPool: Math.round((authorPool - totalAuthor) * 100) / 100,
      readers: readerRows,
      authors: authorRows,
      alreadyExecuted: !!existing,
    };
  },

  async execute(
    totalAdRevenue: number,
    monthInput: string,
    executedByUserId: string | undefined,
    force: boolean
  ) {
    const { key } = monthBounds(monthInput);
    const existing = await prisma.adRevenueDistributionRun.findUnique({ where: { month: key } });
    if (existing && !force) {
      throw new Error(`Distribution for ${key} already executed.`);
    }
    if (existing && force) {
      if (process.env.AD_ALLOW_DISTRIBUTION_FORCE !== 'true') {
        throw new Error(
          'Re-running a month is disabled by default (prevents double payouts). Set AD_ALLOW_DISTRIBUTION_FORCE=true only after reversing wallet entries, or use a new month key.'
        );
      }
      await prisma.adRevenueDistributionRun.delete({ where: { month: key } });
    }

    const preview = await this.preview(totalAdRevenue, monthInput);

    const grossD = d(preview.grossAdRevenue);
    const platformPoolD = d(preview.platformPool);
    const readerPoolD = d(preview.readerPool);
    const authorPoolD = d(preview.authorPool);

    await prisma.$transaction(async (tx) => {
      const run = await tx.adRevenueDistributionRun.create({
        data: {
          month: key,
          grossAdRevenue: grossD,
          platformPoolPct: d(AD_SHARE_PROGRAM.PLATFORM_POOL_OF_GROSS),
          platformPool: platformPoolD,
          readerPool: readerPoolD,
          authorPool: authorPoolD,
          readerPoolRatio: d(AD_SHARE_PROGRAM.READER_SHARE_OF_PLATFORM_POOL),
          authorPoolRatio: d(AD_SHARE_PROGRAM.AUTHOR_SHARE_OF_PLATFORM_POOL),
          formulaVersion: AD_SHARE_PROGRAM.FORMULA_VERSION,
          readerRecipients: preview.readerRecipients,
          authorRecipients: preview.authorRecipients,
          totalPaidReaders: d(preview.totalReaderPayout),
          totalPaidAuthors: d(preview.totalAuthorPayout),
          executedByUserId: executedByUserId || null,
          metadata: {
            unallocatedReaderPool: preview.unallocatedReaderPool,
            unallocatedAuthorPool: preview.unallocatedAuthorPool,
            readerCountPreview: preview.readers.length,
            authorCountPreview: preview.authors.length,
          } as object,
        },
      });

      const pay = async (userId: string, amount: number, description: string, refType: string) => {
        if (amount < AD_SHARE_PROGRAM.MIN_PAYOUT_INR) return;
        const amt = d(amount);
        const updated = await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { increment: amt } },
          select: { walletBalance: true },
        });
        await tx.walletTransaction.create({
          data: {
            userId,
            type: 'REWARD',
            amount: amt,
            balance: updated.walletBalance,
            description,
            referenceId: key,
            referenceType: refType,
            status: 'completed',
          },
        });
      };

      for (const r of preview.readers) {
        await pay(
          r.userId,
          r.amount,
          `Reader ad share ${key}: ₹${r.amount} (reading rewards pool)`,
          AD_SHARE_PROGRAM.REF_TYPE_READER
        );
      }

      for (const a of preview.authors) {
        await pay(
          a.authorId,
          a.amount,
          `Author ad share ${key}: ₹${a.amount} (creator pool)`,
          AD_SHARE_PROGRAM.REF_TYPE_AUTHOR
        );
      }

      return run;
    });

    return preview;
  },

  async getUserAdShareHistory(userId: string, limit = 24) {
    const rows = await prisma.walletTransaction.findMany({
      where: {
        userId,
        referenceType: {
          in: [AD_SHARE_PROGRAM.REF_TYPE_READER, AD_SHARE_PROGRAM.REF_TYPE_AUTHOR, 'ad_revenue_share'],
        },
        amount: { gt: 0 },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    const total = await prisma.walletTransaction.aggregate({
      where: {
        userId,
        referenceType: {
          in: [AD_SHARE_PROGRAM.REF_TYPE_READER, AD_SHARE_PROGRAM.REF_TYPE_AUTHOR, 'ad_revenue_share'],
        },
        amount: { gt: 0 },
      },
      _sum: { amount: true },
    });
    return {
      items: rows.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        description: t.description,
        referenceType: t.referenceType,
        month: t.referenceId,
        createdAt: t.createdAt,
      })),
      lifetimeTotalINR: Number(total._sum.amount ?? 0),
    };
  },
};
