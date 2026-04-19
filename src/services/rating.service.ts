import prisma from '../config/database';

export class RatingService {
  static async rateAuthor(
    reviewerId: string,
    authorId: string,
    rating: number,
    review?: string,
    isAnonymous: boolean = false
  ) {
    if (reviewerId === authorId) {
      throw new Error('Cannot rate yourself');
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const existing = await prisma.rating.findUnique({
      where: { reviewerId_authorId: { reviewerId, authorId } },
    });

    if (existing) {
      return prisma.rating.update({
        where: { id: existing.id },
        data: { rating, review, isAnonymous },
      });
    }

    return prisma.rating.create({
      data: {
        reviewerId,
        authorId,
        rating,
        review,
        isAnonymous,
      },
    });
  }

  static async getAuthorRatings(authorId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [ratings, total, stats] = await Promise.all([
      prisma.rating.findMany({
        where: { authorId, isAnonymous: false },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          reviewer: { select: { id: true, username: true, name: true, profileImage: true } },
        },
      }),
      prisma.rating.count({ where: { authorId } }),
      prisma.rating.aggregate({
        where: { authorId },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    const distribution = await prisma.rating.groupBy({
      by: ['rating'],
      where: { authorId },
      _count: { id: true },
    });

    return {
      ratings,
      total,
      averageRating: stats._avg.rating || 0,
      totalRatings: stats._count.id,
      distribution: distribution.reduce((acc, d) => {
        acc[d.rating] = d._count.id;
        return acc;
      }, {} as Record<number, number>),
    };
  }

  static async getUserRatingForAuthor(reviewerId: string, authorId: string) {
    return prisma.rating.findUnique({
      where: { reviewerId_authorId: { reviewerId, authorId } },
    });
  }

  static async getTopRatedAuthors(limit: number = 10) {
    const topAuthors = await prisma.rating.groupBy({
      by: ['authorId'],
      _avg: { rating: true },
      _count: { id: true },
      having: { id: { _count: { gte: 5 } } },
      orderBy: { _avg: { rating: 'desc' } },
      take: limit,
    });

    const authors = await prisma.user.findMany({
      where: { id: { in: topAuthors.map(a => a.authorId) } },
      select: {
        id: true,
        username: true,
        name: true,
        profileImage: true,
        isCreator: true,
      },
    });

    return authors.map(author => {
      const stats = topAuthors.find(a => a.authorId === author.id);
      return {
        ...author,
        averageRating: stats?._avg.rating || 0,
        totalRatings: stats?._count.id || 0,
      };
    });
  }
}