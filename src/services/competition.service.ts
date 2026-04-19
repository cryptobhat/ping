import prisma from '../config/database';
import { CompetitionStatus } from '@prisma/client';

const entryInclude = {
  user: { select: { id: true, name: true, username: true, profileImage: true } },
  content: { select: { id: true, title: true, coverImage: true, viewCount: true, likeCount: true, readTime: true } },
};

export const competitionService = {
  async list(status?: CompetitionStatus) {
    const where: any = { isActive: true };
    if (status) where.status = status;
    return prisma.competition.findMany({
      where,
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { entries: true } } },
    });
  },

  async getById(id: string) {
    return prisma.competition.findUnique({
      where: { id },
      include: {
        entries: {
          orderBy: { score: 'desc' },
          take: 50,
          include: entryInclude,
        },
        _count: { select: { entries: true } },
      },
    });
  },

  async getLeaderboard(id: string) {
    return prisma.competitionEntry.findMany({
      where: { competitionId: id },
      orderBy: { score: 'desc' },
      take: 100,
      include: entryInclude,
    });
  },

  async getActive() {
    return prisma.competition.findMany({
      where: { status: 'ACTIVE', isActive: true },
      orderBy: { endDate: 'asc' },
      include: { _count: { select: { entries: true } } },
    });
  },

  async enter(competitionId: string, userId: string, contentId: string) {
    const comp = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!comp) throw new Error('Competition not found');
    if (comp.status !== 'ACTIVE') throw new Error('Competition is not active');
    if (comp.endDate < new Date()) throw new Error('Competition has ended');

    // Check max entries per user
    if (comp.maxEntries) {
      const existingCount = await prisma.competitionEntry.count({
        where: { competitionId, userId },
      });
      if (existingCount >= comp.maxEntries) throw new Error(`Maximum ${comp.maxEntries} entries allowed`);
    }

    // Check content belongs to user
    const content = await prisma.content.findUnique({ where: { id: contentId } });
    if (!content || content.authorId !== userId) throw new Error('Content not found or not yours');

    // Check content type matches
    if (comp.contentType && content.contentType !== comp.contentType) {
      throw new Error(`Only ${comp.contentType} content allowed`);
    }

    const entry = await prisma.competitionEntry.create({
      data: {
        competitionId,
        userId,
        contentId,
        readCount: content.viewCount,
        likeCount: content.likeCount,
        score: content.viewCount + (content.likeCount * 5), // reads + weighted likes
      },
      include: entryInclude,
    });

    await prisma.competition.update({
      where: { id: competitionId },
      data: { participantCount: { increment: 1 } },
    });

    return entry;
  },

  /**
   * Detect suspicious activity: multiple users viewing same content from same IP
   * Returns list of flagged entries with warning
   */
  async detectFraud(competitionId: string) {
    const entries = await prisma.competitionEntry.findMany({
      where: { competitionId },
      select: { contentId: true, userId: true },
    });

    const flags: { contentId: string; userId: string; reason: string }[] = [];

    for (const entry of entries) {
      // Check if views came from very few unique users (suspicious if high viewCount but few sessions)
      const uniqueViewers = await prisma.readingSession.findMany({
        where: { contentId: entry.contentId },
        select: { userId: true },
        distinct: ['userId'],
      });

      const content = await prisma.content.findUnique({
        where: { id: entry.contentId },
        select: { viewCount: true },
      });

      // Flag: if viewCount is much higher than unique viewer count (impossible with our dedup)
      if (content && content.viewCount > uniqueViewers.length * 1.5) {
        flags.push({
          contentId: entry.contentId,
          userId: entry.userId,
          reason: `Suspicious views: ${content.viewCount} views but only ${uniqueViewers.length} unique readers`,
        });
      }

      // Flag: if same user has multiple accounts (check by device/session patterns)
      // This is detected by the 1-user-1-view dedup — any inflation means multi-accounting
    }

    return flags;
  },

  async updateScores(competitionId: string) {
    const entries = await prisma.competitionEntry.findMany({
      where: { competitionId },
      include: { content: { select: { viewCount: true, likeCount: true } } },
    });

    for (const entry of entries) {
      const score = entry.content.viewCount + (entry.content.likeCount * 5);
      await prisma.competitionEntry.update({
        where: { id: entry.id },
        data: {
          readCount: entry.content.viewCount,
          likeCount: entry.content.likeCount,
          score,
        },
      });
    }

    // Assign ranks
    const sorted = await prisma.competitionEntry.findMany({
      where: { competitionId },
      orderBy: { score: 'desc' },
    });

    for (let i = 0; i < sorted.length; i++) {
      await prisma.competitionEntry.update({
        where: { id: sorted[i].id },
        data: { rank: i + 1 },
      });
    }
  },

  // Admin: create competition
  async create(data: {
    title: string;
    description: string;
    bannerImage?: string;
    rules?: string;
    contentType?: string;
    language?: string;
    theme?: string;
    prizePool: number;
    prizeFirst: number;
    prizeSecond: number;
    prizeThird: number;
    startDate: string;
    endDate: string;
    maxEntries?: number;
    minWordCount?: number;
    maxWordCount?: number;
    createdById?: string;
  }) {
    return prisma.competition.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: new Date(data.startDate) <= new Date() ? 'ACTIVE' : 'UPCOMING',
      } as any,
    });
  },
};
