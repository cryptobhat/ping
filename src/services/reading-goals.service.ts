import prisma from '../config/database';

export class ReadingGoalsService {
  /**
   * Get user's reading goals, streak info, and today's progress.
   */
  static async getGoals(userId: string) {
    const stats = await prisma.readingStats.upsert({
      where: { userId },
      create: {
        userId,
        dailyGoalMinutes: 15,
      },
      update: {},
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLog = await prisma.dailyReadingLog.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    const todayReadingMinutes = todayLog
      ? Math.floor(todayLog.readingTimeSeconds / 60)
      : 0;

    const goalCompleted = todayReadingMinutes >= stats.dailyGoalMinutes;

    // Get last 7 days of reading logs for the weekly chart
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const weekLogs = await prisma.dailyReadingLog.findMany({
      where: {
        userId,
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: 'asc' },
    });

    // Count how many days this week met the goal
    const daysGoalMet = weekLogs.filter(
      (log) => Math.floor(log.readingTimeSeconds / 60) >= stats.dailyGoalMinutes
    ).length;

    return {
      dailyGoalMinutes: stats.dailyGoalMinutes,
      todayReadingMinutes,
      todayReadingSeconds: todayLog?.readingTimeSeconds ?? 0,
      goalCompleted,
      currentStreak: stats.currentStreakDays,
      longestStreak: stats.longestStreakDays,
      totalReadingTimeSeconds: stats.totalReadingTimeSeconds,
      totalContentRead: stats.totalContentRead,
      lastReadAt: stats.lastReadAt,
      weekSummary: {
        daysGoalMet,
        logs: weekLogs.map((log) => ({
          date: log.date,
          readingMinutes: Math.floor(log.readingTimeSeconds / 60),
          contentCount: log.contentCount,
          wordsRead: log.wordsRead,
        })),
      },
    };
  }

  /**
   * Update the user's daily reading goal (in minutes).
   */
  static async updateGoal(userId: string, dailyGoalMinutes: number) {
    const clamped = Math.min(Math.max(1, dailyGoalMinutes), 480); // 1 min to 8 hours

    const stats = await prisma.readingStats.upsert({
      where: { userId },
      create: {
        userId,
        dailyGoalMinutes: clamped,
      },
      update: {
        dailyGoalMinutes: clamped,
      },
    });

    return {
      dailyGoalMinutes: stats.dailyGoalMinutes,
    };
  }

  /**
   * Log a reading session toward today's goal.
   * This is a lightweight endpoint for the mobile app to report
   * reading time without a full session lifecycle.
   */
  static async logSession(
    userId: string,
    data: { durationSeconds: number; contentId?: string; wordsRead?: number }
  ) {
    const { durationSeconds, contentId, wordsRead = 0 } = data;

    if (durationSeconds <= 0) {
      throw new Error('Duration must be positive');
    }

    // Update the daily log
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyLog = await prisma.dailyReadingLog.upsert({
      where: { userId_date: { userId, date: today } },
      create: {
        userId,
        date: today,
        readingTimeSeconds: durationSeconds,
        wordsRead,
        contentCount: contentId ? 1 : 0,
      },
      update: {
        readingTimeSeconds: { increment: durationSeconds },
        wordsRead: { increment: wordsRead },
        contentCount: contentId ? { increment: 1 } : undefined,
      },
    });

    // Update overall reading stats
    await prisma.readingStats.upsert({
      where: { userId },
      create: {
        userId,
        totalReadingTimeSeconds: durationSeconds,
        totalWordsRead: wordsRead,
        totalContentRead: contentId ? 1 : 0,
        lastReadAt: new Date(),
      },
      update: {
        totalReadingTimeSeconds: { increment: durationSeconds },
        totalWordsRead: { increment: wordsRead },
        totalContentRead: contentId ? { increment: 1 } : undefined,
        lastReadAt: new Date(),
      },
    });

    // Update streak
    await this.updateStreak(userId);

    // Check if goal was just completed
    const stats = await prisma.readingStats.findUnique({ where: { userId } });
    const todayMinutes = Math.floor(dailyLog.readingTimeSeconds / 60);
    const goalCompleted = stats ? todayMinutes >= stats.dailyGoalMinutes : false;

    // Update content view count if contentId provided
    if (contentId) {
      await prisma.content.update({
        where: { id: contentId },
        data: { viewCount: { increment: 1 } },
      }).catch(() => {
        // Content may not exist — ignore silently
      });
    }

    return {
      todayReadingMinutes: todayMinutes,
      todayReadingSeconds: dailyLog.readingTimeSeconds,
      goalCompleted,
      dailyGoalMinutes: stats?.dailyGoalMinutes ?? 15,
      currentStreak: stats?.currentStreakDays ?? 0,
    };
  }

  /**
   * Recalculate the user's reading streak based on daily logs.
   */
  private static async updateStreak(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const stats = await prisma.readingStats.findUnique({ where: { userId } });
    if (!stats) return;

    const lastReadDate = stats.lastReadAt ? new Date(stats.lastReadAt) : null;
    let newStreak = stats.currentStreakDays;

    if (lastReadDate) {
      const lastDay = new Date(lastReadDate);
      lastDay.setHours(0, 0, 0, 0);

      if (lastDay.getTime() === today.getTime()) {
        // Already read today — streak unchanged
      } else if (lastDay.getTime() === yesterday.getTime()) {
        newStreak += 1;
      } else {
        newStreak = 1; // streak broken, restart
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
}
