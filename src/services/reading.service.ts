import prisma from '../config/database';

export class ReadingService {
  static async startSession(userId: string, contentId: string) {
    const session = await prisma.readingSession.create({
      data: {
        userId,
        contentId,
        startTime: new Date(),
      },
    });

    return session;
  }

  static async endSession(
    sessionId: string,
    userId: string,
    data: { durationSeconds: number; wordsRead: number; scrollPercentage: number; isCompleted: boolean }
  ) {
    const existing = await prisma.readingSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!existing) {
      const err = new Error('Session not found') as Error & { code?: string };
      err.code = 'P2025';
      throw err;
    }

    const session = await prisma.readingSession.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(),
        durationSeconds: data.durationSeconds,
        wordsRead: data.wordsRead,
        scrollPercentage: data.scrollPercentage,
        isCompleted: data.isCompleted,
      },
    });

    await this.updateReadingStats(session.userId, data.durationSeconds, data.wordsRead);
    await this.updateDailyLog(session.userId, data.durationSeconds, data.wordsRead);
    // View count is incremented when content is opened (getContentById); do not double-count here.

    return session;
  }

  static async updateReadingStats(userId: string, durationSeconds: number, wordsRead: number) {
    await prisma.readingStats.upsert({
      where: { userId },
      create: {
        userId,
        totalReadingTimeSeconds: durationSeconds,
        totalWordsRead: wordsRead,
        totalContentRead: 1,
        lastReadAt: new Date(),
      },
      update: {
        totalReadingTimeSeconds: { increment: durationSeconds },
        totalWordsRead: { increment: wordsRead },
        totalContentRead: { increment: 1 },
        lastReadAt: new Date(),
      },
    });

    await this.updateStreak(userId);
  }

  static async updateStreak(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const stats = await prisma.readingStats.findUnique({
      where: { userId },
    });

    if (!stats) return;

    const lastReadDate = stats.lastReadAt ? new Date(stats.lastReadAt) : null;
    let newStreak = stats.currentStreakDays;

    if (lastReadDate) {
      lastReadDate.setHours(0, 0, 0, 0);

      if (lastReadDate.getTime() === today.getTime()) {
        // Already read today, no change
      } else if (lastReadDate.getTime() === yesterday.getTime()) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    await prisma.readingStats.update({
      where: { userId },
      data: {
        currentStreakDays: newStreak,
        longestStreakDays: Math.max(stats.longestStreakDays, newStreak),
      },
    });
  }

  static async updateDailyLog(userId: string, durationSeconds: number, wordsRead: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailyReadingLog.upsert({
      where: {
        userId_date: { userId, date: today },
      },
      create: {
        userId,
        date: today,
        readingTimeSeconds: durationSeconds,
        wordsRead,
        contentCount: 1,
      },
      update: {
        readingTimeSeconds: { increment: durationSeconds },
        wordsRead: { increment: wordsRead },
        contentCount: { increment: 1 },
      },
    });
  }

  static async updateContentViews(contentId: string) {
    await prisma.content.update({
      where: { id: contentId },
      data: { viewCount: { increment: 1 } },
    });
  }

  static async getReadingStats(userId: string) {
    const stats = await prisma.readingStats.findUnique({
      where: { userId },
    });

    const last7Days = await prisma.dailyReadingLog.findMany({
      where: {
        userId,
        date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { date: 'asc' },
    });

    return {
      ...stats,
      last7Days,
    };
  }

  static async getLeaderboard(type: 'time' | 'streak' = 'time', limit: number = 10) {
    const orderBy = type === 'time' 
      ? { totalReadingTimeSeconds: 'desc' as const }
      : { currentStreakDays: 'desc' as const };

    const leaderboard = await prisma.readingStats.findMany({
      take: limit,
      orderBy,
      include: {
        user: {
          select: { id: true, username: true, name: true, profileImage: true },
        },
      },
    });

    return leaderboard;
  }

  static async getSessionHistory(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      prisma.readingSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          content: {
            select: { id: true, title: true, contentType: true },
          },
        },
      }),
      prisma.readingSession.count({ where: { userId } }),
    ]);

    return { sessions, total };
  }
}