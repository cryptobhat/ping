import prisma from '../config/database';
import { ContentType } from '@prisma/client';

interface ContentAnalysisResult {
  autoTags: string[];
  sentimentScore: number | null;
  sentimentLabel: string | null;
  qualityScore: number | null;
  readingLevel: string | null;
  keywords: string[];
}

export class AiService {
  static async queueContentAnalysis(contentId: string) {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { id: true, title: true, body: true, contentType: true },
    });

    if (!content) {
      throw new Error('Content not found');
    }

    const existing = await prisma.aiProcessingQueue.findFirst({
      where: {
        entityType: 'content',
        entityId: contentId,
        action: 'analyze',
        status: { in: ['pending', 'processing'] },
      },
    });

    if (existing) {
      return existing;
    }

    const queueItem = await prisma.aiProcessingQueue.create({
      data: {
        entityType: 'content',
        entityId: contentId,
        action: 'analyze',
        payload: {
          title: content.title,
          body: content.body,
          contentType: content.contentType,
        },
        webhookUrl: process.env.AI_WEBHOOK_URL,
      },
    });

    return queueItem;
  }

  static async saveContentAnalysis(contentId: string, analysis: ContentAnalysisResult) {
    const saved = await prisma.contentAnalysis.upsert({
      where: { contentId },
      create: {
        contentId,
        autoTags: analysis.autoTags,
        sentimentScore: analysis.sentimentScore,
        sentimentLabel: analysis.sentimentLabel,
        qualityScore: analysis.qualityScore,
        readingLevel: analysis.readingLevel,
        keywords: analysis.keywords,
      },
      update: {
        autoTags: analysis.autoTags,
        sentimentScore: analysis.sentimentScore,
        sentimentLabel: analysis.sentimentLabel,
        qualityScore: analysis.qualityScore,
        readingLevel: analysis.readingLevel,
        keywords: analysis.keywords,
        analyzedAt: new Date(),
        analysisVersion: { increment: 1 },
      },
    });

    await this.updateContentRecommendations(contentId);

    return saved;
  }

  static async updateContentRecommendations(contentId: string) {
    const analysis = await prisma.contentAnalysis.findUnique({
      where: { contentId },
    });

    if (!analysis || analysis.autoTags.length === 0) return;

    const similarContent = await prisma.contentAnalysis.findMany({
      where: {
        contentId: { not: contentId },
        autoTags: { hasSome: analysis.autoTags.slice(0, 5) },
      },
      take: 10,
    });

    await prisma.contentAnalysis.update({
      where: { contentId },
      data: {
        similarContentIds: similarContent.map(s => s.contentId),
      },
    });
  }

  static async getUserRecommendations(userId: string, limit: number = 20) {
    const interests = await prisma.userInterest.findUnique({
      where: { userId },
    });

    if (!interests) {
      return this.getFallbackRecommendations(userId, limit);
    }

    const interestTags = interests.interestTags as string[];
    const preferredTypes = interests.preferredContentTypes as ContentType[];
    const preferredAuthors = interests.preferredAuthors;

    const recommendations = await prisma.content.findMany({
      where: {
        AND: [
          { visibility: 'PUBLIC' },
          {
            OR: [
              { authorId: { in: preferredAuthors } },
              { contentType: { in: preferredTypes } },
              {
                analysis: {
                  autoTags: { hasSome: interestTags },
                },
              },
            ],
          },
          {
            NOT: {
              recommendations: {
                some: {
                  userId,
                  isShown: true,
                },
              },
            },
          },
        ],
      },
      take: limit,
      include: {
        author: {
          select: { id: true, username: true, name: true, profileImage: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        analysis: {
          select: { autoTags: true, qualityScore: true },
        },
      },
    });

    for (const content of recommendations) {
      await prisma.contentRecommendation.create({
        data: {
          userId,
          contentId: content.id,
          recommendationType: interestTags.length > 0 ? 'interest_based' : 'popular',
          relevanceScore: content.analysis?.qualityScore || 0,
          sourceTags: interestTags.slice(0, 5),
          isShown: true,
          shownAt: new Date(),
        },
      });
    }

    return recommendations;
  }

  static async getFallbackRecommendations(userId: string, limit: number) {
    const trending = await prisma.trendingContent.findMany({
      where: {
        timeWindow: 'daily',
        expiresAt: { gte: new Date() },
        content: { visibility: 'PUBLIC' },
      },
      orderBy: { trendingScore: 'desc' },
      take: limit,
      include: {
        content: {
          include: {
            author: {
              select: { id: true, username: true, name: true, profileImage: true },
            },
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    return trending.map(t => t.content);
  }

  static async updateUserInterests(userId: string) {
    const sessions = await prisma.readingSession.findMany({
      where: {
        userId,
        durationSeconds: { gte: 30 },
      },
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        content: {
          include: {
            author: { select: { id: true } },
            analysis: { select: { autoTags: true } },
          },
        },
      },
    });

    if (sessions.length === 0) return;

    const tagFrequency: Record<string, number> = {};
    const typeFrequency: Record<string, number> = {};
    const authorFrequency: Record<string, number> = {};

    for (const session of sessions) {
      const weight = session.isCompleted ? 2 : 1;

      if (session.content.analysis?.autoTags) {
        for (const tag of session.content.analysis.autoTags) {
          tagFrequency[tag] = (tagFrequency[tag] || 0) + weight;
        }
      }

      typeFrequency[session.content.contentType] = (typeFrequency[session.content.contentType] || 0) + weight;
      authorFrequency[session.content.author.id] = (authorFrequency[session.content.author.id] || 0) + weight;
    }

    const topTags = Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);

    const topTypes = Object.entries(typeFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);

    const topAuthors = Object.entries(authorFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    const avgDuration = sessions.reduce((sum, s) => sum + s.durationSeconds, 0) / sessions.length;

    await prisma.userInterest.upsert({
      where: { userId },
      create: {
        userId,
        interestTags: topTags,
        preferredContentTypes: topTypes,
        preferredAuthors: topAuthors,
        avgSessionDurationSeconds: Math.round(avgDuration),
      },
      update: {
        interestTags: topTags,
        preferredContentTypes: topTypes,
        preferredAuthors: topAuthors,
        avgSessionDurationSeconds: Math.round(avgDuration),
        updatedAt: new Date(),
      },
    });
  }

  static async markRecommendationInteracted(userId: string, contentId: string) {
    await prisma.contentRecommendation.updateMany({
      where: { userId, contentId },
      data: {
        isInteracted: true,
        interactedAt: new Date(),
      },
    });

    await this.updateUserInterests(userId);
  }

  static async getPendingAnalysisJobs(limit: number = 10) {
    return prisma.aiProcessingQueue.findMany({
      where: { status: 'pending' },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });
  }

  static async markJobProcessing(jobId: string) {
    await prisma.aiProcessingQueue.update({
      where: { id: jobId },
      data: { status: 'processing' },
    });
  }

  static async markJobCompleted(jobId: string, result: any) {
    await prisma.aiProcessingQueue.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        result,
        processedAt: new Date(),
      },
    });
  }

  static async markJobFailed(jobId: string, error: string) {
    await prisma.aiProcessingQueue.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        errorMessage: error,
        processedAt: new Date(),
      },
    });
  }
}