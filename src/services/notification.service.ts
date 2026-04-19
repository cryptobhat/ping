import { safeEmit } from "../utils/socket-emit";
import prisma from '../config/database';

interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: any;
}

export class NotificationService {
  static async create(data: CreateNotificationData) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data,
      },
    });
    safeEmit(data.userId, "notification", { type: data.type, message: data.body || data.title });
    return notification;
  }

  static async createMultiple(userIds: string[], data: Omit<CreateNotificationData, 'userId'>) {
    const notifications = userIds.map(userId => ({
      userId,
      type: data.type,
      title: data.title,
      body: data.body,
      data: data.data,
    }));

    return prisma.notification.createMany({
      data: notifications,
    });
  }

  static async getUserNotifications(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return { notifications, total };
  }

  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  static async deleteNotification(notificationId: string, userId: string) {
    return prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }

  static async notifyNewFollower(followerId: string, followingId: string) {
    const follower = await prisma.user.findUnique({
      where: { id: followerId },
      select: { name: true, username: true },
    });

    if (!follower) return null;

    return this.create({
      userId: followingId,
      type: 'new_follower',
      title: 'New Follower',
      body: `${follower.name || follower.username} started following you`,
      data: { followerId },
    });
  }

  static async notifyNewLike(userId: string, contentId: string, likerId: string) {
    const liker = await prisma.user.findUnique({
      where: { id: likerId },
      select: { name: true, username: true },
    });

    if (!liker) return null;

    return this.create({
      userId,
      type: 'new_like',
      title: 'New Like',
      body: `${liker.name || liker.username} liked your content`,
      data: { contentId, likerId },
    });
  }

  static async notifyNewGift(senderId: string, receiverId: string, giftName: string) {
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true, username: true },
    });

    if (!sender) return null;

    return this.create({
      userId: receiverId,
      type: 'new_gift',
      title: 'New Gift',
      body: `${sender.name || sender.username} sent you a ${giftName}`,
      data: { senderId, giftName },
    });
  }

  static async notifyNewSupport(supporterId: string, creatorId: string, coins: number) {
    const supporter = await prisma.user.findUnique({
      where: { id: supporterId },
      select: { name: true, username: true },
    });

    if (!supporter) return null;

    return this.create({
      userId: creatorId,
      type: 'new_support',
      title: 'New Support',
      body: `${supporter.name || supporter.username} supported you with ${coins} coins`,
      data: { supporterId, coins },
    });
  }

  static async notifyNewMessage(senderId: string, receiverId: string) {
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true, username: true },
    });

    if (!sender) return null;

    return this.create({
      userId: receiverId,
      type: 'new_message',
      title: 'New Message',
      body: `You have a new message from ${sender.name || sender.username}`,
      data: { senderId },
    });
  }

  // ── Retention-focused notification methods ──────────────────────────

  /**
   * Rank followers by taste overlap + engagement with author/category; cap volume and daily sends per user.
   */
  static async notifyNewContentRanked(
    authorId: string,
    contentId: string,
    title: string,
    contentType: string
  ) {
    const MAX_TOP = parseInt(process.env.NEW_CONTENT_NOTIFY_TOP_N || '500', 10);
    const MIN_SCORE = parseFloat(process.env.NEW_CONTENT_NOTIFY_MIN_SCORE || '10');
    const DAILY_CAP = parseInt(process.env.NEW_CONTENT_NOTIFY_DAILY_CAP_PER_USER || '12', 10);

    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: {
        categoryId: true,
        language: true,
        contentType: true,
        authorId: true,
        analysis: { select: { autoTags: true } },
      },
    });

    const author = await prisma.user.findUnique({
      where: { id: authorId },
      select: { name: true, username: true },
    });

    const followers = await prisma.follow.findMany({
      where: { followingId: authorId },
      select: { followerId: true },
    });

    if (!author || followers.length === 0) return;

    const followerIds = followers.map((f) => f.followerId);
    const displayName = author.name || author.username;
    const tags = content?.analysis?.autoTags || [];
    const since90 = new Date(Date.now() - 90 * 86400000);
    const since60 = new Date(Date.now() - 60 * 86400000);

    const [authorReads, authorLikes, categoryReads] = await Promise.all([
      prisma.readingSession.groupBy({
        by: ['userId'],
        where: {
          userId: { in: followerIds },
          createdAt: { gte: since90 },
          content: { authorId },
        },
        _count: { _all: true },
      }),
      prisma.like.groupBy({
        by: ['userId'],
        where: { userId: { in: followerIds }, content: { authorId } },
        _count: { _all: true },
      }),
      content?.categoryId
        ? prisma.readingSession.groupBy({
            by: ['userId'],
            where: {
              userId: { in: followerIds },
              createdAt: { gte: since60 },
              content: { categoryId: content.categoryId, language: content.language },
            },
            _count: { _all: true },
          })
        : Promise.resolve([] as { userId: string; _count: { _all: number } }[]),
    ]);

    const readMap = new Map(authorReads.map((r) => [r.userId, r._count._all]));
    const likeMap = new Map(authorLikes.map((r) => [r.userId, r._count._all]));
    const catMap = new Map(categoryReads.map((r) => [r.userId, r._count._all]));

    const interests = await prisma.userInterest.findMany({
      where: { userId: { in: followerIds } },
    });
    const interestByUser = new Map(interests.map((i) => [i.userId, i]));

    const scored = followerIds.map((fid) => {
      let s = 8;
      s += Math.min(22, (readMap.get(fid) || 0) * 4);
      s += Math.min(18, (likeMap.get(fid) || 0) * 3);
      s += Math.min(14, (catMap.get(fid) || 0) * 2);
      const ui = interestByUser.get(fid);
      if (ui) {
        if (ui.preferredAuthors.includes(authorId)) s += 12;
        const pt = (ui.preferredContentTypes as string[]) || [];
        if (pt.includes(contentType)) s += 8;
        const itags = (ui.interestTags as string[]) || [];
        for (const t of tags) {
          if (itags.includes(t)) s += 3;
        }
      }
      return { userId: fid, score: s };
    });

    scored.sort((a, b) => b.score - a.score);
    const aboveMin = scored.filter((x) => x.score >= MIN_SCORE).slice(0, MAX_TOP);
    if (aboveMin.length === 0) return;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const candidateIds = aboveMin.map((x) => x.userId);

    const notifyCounts = await prisma.notification.groupBy({
      by: ['userId'],
      where: {
        userId: { in: candidateIds },
        type: 'new_content',
        createdAt: { gte: startOfDay },
      },
      _count: { id: true },
    });
    const countMap = new Map(notifyCounts.map((n) => [n.userId, n._count.id]));

    const finalIds = candidateIds.filter((uid) => (countMap.get(uid) || 0) < DAILY_CAP);
    if (finalIds.length === 0) return;

    await this.createMultiple(finalIds, {
      type: 'new_content',
      title: `${displayName} published a new ${contentType.toLowerCase()}`,
      body: title,
      data: { contentId, authorId },
    });
  }

  /**
   * @deprecated Use notifyNewContentRanked — kept as alias for callers.
   */
  static async notifyFollowersNewContent(
    authorId: string,
    contentId: string,
    title: string,
    contentType: string
  ) {
    return this.notifyNewContentRanked(authorId, contentId, title, contentType);
  }

  /**
   * Notify all followers when an author starts a live reading room.
   */
  static async notifyFollowersLive(
    hostId: string,
    roomId: string,
    roomTitle: string
  ) {
    const followers = await prisma.follow.findMany({
      where: { followingId: hostId },
      select: { followerId: true },
    });

    const host = await prisma.user.findUnique({
      where: { id: hostId },
      select: { name: true, username: true },
    });

    if (!host || followers.length === 0) return;

    const displayName = host.name || host.username;
    const userIds = followers.map((f) => f.followerId);

    await this.createMultiple(userIds, {
      type: 'live_room',
      title: `${displayName} is live!`,
      body: roomTitle || 'Join the reading room',
      data: { roomId, hostId },
    });
  }

  /**
   * Rank series followers by category/language reads + interest overlap; same caps as new content.
   */
  static async notifySeriesFollowersNewEpisodeRanked(
    seriesId: string,
    episodeTitle: string,
    contentId: string
  ) {
    const MAX_TOP = parseInt(process.env.SERIES_NOTIFY_TOP_N || process.env.NEW_CONTENT_NOTIFY_TOP_N || '500', 10);
    const MIN_SCORE = parseFloat(process.env.SERIES_NOTIFY_MIN_SCORE || process.env.NEW_CONTENT_NOTIFY_MIN_SCORE || '10');
    const DAILY_CAP = parseInt(
      process.env.SERIES_NOTIFY_DAILY_CAP_PER_USER || process.env.NEW_CONTENT_NOTIFY_DAILY_CAP_PER_USER || '12',
      10
    );

    const series = await prisma.series.findUnique({
      where: { id: seriesId },
      select: { title: true },
    });

    const followers = await prisma.seriesFollow.findMany({
      where: { seriesId },
      select: { userId: true },
    });

    if (!series || followers.length === 0) return;

    const followerIds = followers.map((f) => f.userId);
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: {
        categoryId: true,
        language: true,
        contentType: true,
        authorId: true,
        analysis: { select: { autoTags: true } },
      },
    });

    const since60 = new Date(Date.now() - 60 * 86400000);
    const tags = content?.analysis?.autoTags || [];

    const categoryReads =
      content?.categoryId != null
        ? await prisma.readingSession.groupBy({
            by: ['userId'],
            where: {
              userId: { in: followerIds },
              createdAt: { gte: since60 },
              content: { categoryId: content.categoryId, language: content.language },
            },
            _count: { _all: true },
          })
        : [];

    const catMap = new Map(categoryReads.map((r) => [r.userId, r._count._all]));

    const interests = await prisma.userInterest.findMany({
      where: { userId: { in: followerIds } },
    });
    const interestByUser = new Map(interests.map((i) => [i.userId, i]));

    const scored = followerIds.map((fid) => {
      let s = 12;
      s += Math.min(18, (catMap.get(fid) || 0) * 2);
      const ui = interestByUser.get(fid);
      if (ui && content) {
        if (ui.preferredAuthors.includes(content.authorId)) s += 10;
        const pt = (ui.preferredContentTypes as string[]) || [];
        if (pt.includes(content.contentType)) s += 6;
        const itags = (ui.interestTags as string[]) || [];
        for (const t of tags) {
          if (itags.includes(t)) s += 2;
        }
      }
      return { userId: fid, score: s };
    });

    scored.sort((a, b) => b.score - a.score);
    const aboveMin = scored.filter((x) => x.score >= MIN_SCORE).slice(0, MAX_TOP);
    if (aboveMin.length === 0) return;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const candidateIds = aboveMin.map((x) => x.userId);

    const notifyCounts = await prisma.notification.groupBy({
      by: ['userId'],
      where: {
        userId: { in: candidateIds },
        type: 'new_episode',
        createdAt: { gte: startOfDay },
      },
      _count: { id: true },
    });
    const countMap = new Map(notifyCounts.map((n) => [n.userId, n._count.id]));

    const finalIds = candidateIds.filter((uid) => (countMap.get(uid) || 0) < DAILY_CAP);
    if (finalIds.length === 0) return;

    await this.createMultiple(finalIds, {
      type: 'new_episode',
      title: `New episode in ${series.title}`,
      body: episodeTitle,
      data: { seriesId, contentId },
    });
  }

  /**
   * @deprecated Use notifySeriesFollowersNewEpisodeRanked.
   */
  static async notifySeriesFollowersNewEpisode(
    seriesId: string,
    episodeTitle: string,
    contentId: string
  ) {
    return this.notifySeriesFollowersNewEpisodeRanked(seriesId, episodeTitle, contentId);
  }

  /**
   * Notify users about trending content (admin/cron triggered).
   * Notifies users who have read content in the same category.
   */
  static async notifyTrendingContent(contentId: string) {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { id: true, title: true, categoryId: true, authorId: true, contentType: true },
    });

    if (!content || !content.categoryId) return;

    // Find users who have read content in the same category (recent readers)
    const recentReaders = await prisma.readingSession.findMany({
      where: {
        content: { categoryId: content.categoryId },
        userId: { not: content.authorId }, // Don't notify the author
      },
      select: { userId: true },
      distinct: ['userId'],
      take: 500,
    });

    if (recentReaders.length === 0) return;

    const userIds = recentReaders.map((r) => r.userId);

    await this.createMultiple(userIds, {
      type: 'trending',
      title: 'Trending now',
      body: content.title || 'Check out what everyone is reading',
      data: { contentId: content.id },
    });
  }

  /**
   * Notify all participants when a competition is ending soon (< 24 hours).
   */
  static async notifyCompetitionEnding(competitionId: string) {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { id: true, title: true, endDate: true, status: true },
    });

    if (!competition || competition.status !== 'ACTIVE') return;

    // Only notify if ending within 24 hours
    const hoursLeft = (competition.endDate.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursLeft > 24 || hoursLeft < 0) return;

    const participants = await prisma.competitionEntry.findMany({
      where: { competitionId },
      select: { userId: true },
      distinct: ['userId'],
    });

    if (participants.length === 0) return;

    const userIds = participants.map((p) => p.userId);
    const timeLabel = hoursLeft < 1
      ? 'less than an hour'
      : `${Math.ceil(hoursLeft)} hours`;

    await this.createMultiple(userIds, {
      type: 'competition_ending',
      title: `Competition ending soon!`,
      body: `"${competition.title}" ends in ${timeLabel} — submit your best work!`,
      data: { competitionId: competition.id },
    });
  }

  /**
   * Admin sends a custom push notification to all active users or filtered by criteria.
   */
  static async adminBroadcast(data: {
    title: string;
    body: string;
    type?: string;
    targetType?: 'all' | 'premium' | 'creators' | 'active_readers';
    data?: any;
  }) {
    const where: any = { isActive: true };

    if (data.targetType === 'premium') {
      where.isPremium = true;
    } else if (data.targetType === 'creators') {
      where.isCreator = true;
    } else if (data.targetType === 'active_readers') {
      // Users who read in the last 7 days
      where.readingSessions = {
        some: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      };
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true },
      take: 10000,
    });

    if (users.length === 0) return { sent: 0 };

    const userIds = users.map((u) => u.id);
    await this.createMultiple(userIds, {
      type: data.type || 'admin_broadcast',
      title: data.title,
      body: data.body,
      data: data.data,
    });

    return { sent: users.length };
  }

  /**
   * AI-based notification: notify users about content matching their reading interests.
   */
  static async notifyByInterest(contentId: string) {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { id: true, title: true, categoryId: true, authorId: true, contentType: true, language: true },
    });

    if (!content || !content.categoryId) return;

    // Find users who have read content in the same category AND language
    const interestedUsers = await prisma.readingSession.findMany({
      where: {
        content: {
          categoryId: content.categoryId,
          language: content.language,
        },
        userId: { not: content.authorId },
      },
      select: { userId: true },
      distinct: ['userId'],
      take: 1000,
    });

    if (interestedUsers.length === 0) return;

    const userIds = interestedUsers.map((u) => u.userId);
    await this.createMultiple(userIds, {
      type: 'recommended',
      title: 'Recommended for you',
      body: content.title || 'New content matching your interests',
      data: { contentId: content.id },
    });

    return { sent: userIds.length };
  }
}