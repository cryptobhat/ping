import prisma from '../config/database';

export class CommentService {
  static async createComment(userId: string, contentId: string, body: string, parentId?: string) {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { allowComments: true },
    });

    if (!content || !content.allowComments) {
      throw new Error('Comments are not allowed on this content');
    }

    const comment = await prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          contentId,
          userId,
          parentId,
          body,
        },
        include: {
          user: { select: { id: true, username: true, name: true, profileImage: true } },
        },
      });

      await tx.content.update({
        where: { id: contentId },
        data: { commentCount: { increment: 1 } },
      });

      if (parentId) {
        await tx.comment.update({
          where: { id: parentId },
          data: { repliesCount: { increment: 1 } },
        });
      }

      return comment;
    });

    return comment;
  }

  static async getComments(contentId: string, page: number, limit: number, parentId?: string) {
    const skip = (page - 1) * limit;

    const where: any = { contentId };
    if (parentId) where.parentId = parentId;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
        include: {
          user: { select: { id: true, username: true, name: true, profileImage: true } },
          likes: { select: { userId: true } },
          _count: { select: { replies: true } },
        },
      }),
      prisma.comment.count({ where }),
    ]);

    return { comments, total };
  }

  static async updateComment(userId: string, commentId: string, body: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true },
    });

    if (!comment || comment.userId !== userId) {
      throw new Error('Unauthorized or comment not found');
    }

    return prisma.comment.update({
      where: { id: commentId },
      data: {
        body,
        isEdited: true,
        editedAt: new Date(),
      },
    });
  }

  static async deleteComment(userId: string, commentId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true, contentId: true, parentId: true },
    });

    if (!comment || comment.userId !== userId) {
      throw new Error('Unauthorized or comment not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.comment.delete({ where: { id: commentId } });

      await tx.content.update({
        where: { id: comment.contentId },
        data: { commentCount: { decrement: 1 } },
      });

      if (comment.parentId) {
        await tx.comment.update({
          where: { id: comment.parentId },
          data: { repliesCount: { decrement: 1 } },
        });
      }
    });

    return { message: 'Comment deleted' };
  }

  static async toggleLike(userId: string, commentId: string) {
    const existing = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.commentLike.delete({ where: { id: existing.id } }),
        prisma.comment.update({
          where: { id: commentId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);

      return { liked: false };
    }

    await prisma.$transaction([
      prisma.commentLike.create({ data: { commentId, userId } }),
      prisma.comment.update({
        where: { id: commentId },
        data: { likesCount: { increment: 1 } },
      }),
    ]);

    return { liked: true };
  }

  static async pinComment(userId: string, commentId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { contentId: true },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    const content = await prisma.content.findUnique({
      where: { id: comment.contentId },
      select: { authorId: true },
    });

    if (!content || content.authorId !== userId) {
      throw new Error('Only content author can pin comments');
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { isPinned: true },
    });

    return { message: 'Comment pinned' };
  }
}