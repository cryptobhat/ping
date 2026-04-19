import prisma from '../config/database';

export class ReportService {
  /**
   * Create a new content report.
   */
  static async createReport(
    reporterId: string,
    data: { contentId?: string; reason: string; description?: string; targetType?: 'CONTENT' | 'USER' | 'COMMENT' | 'MESSAGE'; targetId?: string }
  ) {
    const normalizedReason = data.reason.trim().toLowerCase();
    const baseDescription = data.description?.trim() || '';
    const targetMeta =
      data.targetType && data.targetId
        ? `[target:${data.targetType}:${data.targetId}]`
        : '';
    const normalizedDescription = (targetMeta ? `${targetMeta} ${baseDescription}` : baseDescription).trim() || null;

    const report = await prisma.report.create({
      data: {
        reporterId,
        contentId: data.contentId || null,
        reason: normalizedReason,
        description: normalizedDescription,
        status: 'pending',
      },
      include: {
        content: {
          select: { id: true, title: true, contentType: true },
        },
      },
    });

    return report;
  }

  static async getContentAuthorId(contentId: string): Promise<string | null> {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { authorId: true },
    });
    return content?.authorId || null;
  }

  static async hasOpenDuplicateReport(reporterId: string, contentId: string): Promise<boolean> {
    const existing = await prisma.report.findFirst({
      where: {
        reporterId,
        contentId,
        status: 'pending',
      },
      select: { id: true },
    });
    return !!existing;
  }

  static async hasOpenDuplicateTargetReport(
    reporterId: string,
    targetType: 'CONTENT' | 'USER' | 'COMMENT' | 'MESSAGE',
    targetId: string,
  ): Promise<boolean> {
    const marker = `[target:${targetType}:${targetId}]`;
    const existing = await prisma.report.findFirst({
      where: {
        reporterId,
        status: 'pending',
        description: { contains: marker },
      },
      select: { id: true },
    });
    return !!existing;
  }

  /**
   * List all reports (admin only). Supports pagination and status filter.
   */
  static async listReports(options: {
    page: number;
    limit: number;
    status?: string;
    reason?: string;
    from?: Date;
    to?: Date;
  }) {
    const { page, limit, status, reason, from, to } = options;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (reason) where.reason = reason;
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          content: {
            select: { id: true, title: true, contentType: true, authorId: true },
          },
          reporter: {
            select: { id: true, username: true, name: true },
          },
          resolvedByUser: {
            select: { id: true, username: true, name: true },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return { reports, total };
  }

  /**
   * Resolve a report (admin action).
   */
  static async resolveReport(reportId: string, adminUserId: string, status: string) {
    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        resolvedAt: new Date(),
        resolvedByUserId: adminUserId,
        resolvedById: null,
      },
    });

    return report;
  }
}
