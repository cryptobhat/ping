import prisma from '../config/database';
import { NotificationService } from './notification.service';

export class FollowService {
  static async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (existing) {
      return existing;
    }

    const follow = await prisma.follow.create({
      data: { followerId, followingId },
    });

    // Send notification to the followed user
    NotificationService.notifyNewFollower(followerId, followingId).catch(() => {});

    return follow;
  }

  static async unfollowUser(followerId: string, followingId: string) {
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (!existing) {
      return null;
    }

    return prisma.follow.delete({
      where: { id: existing.id },
    });
  }

  static async getFollowers(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          follower: { select: { id: true, username: true, name: true, profileImage: true } },
        },
      }),
      prisma.follow.count({ where: { followingId: userId } }),
    ]);

    return { followers: followers.map(f => f.follower), total };
  }

  static async getFollowing(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          following: { select: { id: true, username: true, name: true, profileImage: true } },
        },
      }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return { following: following.map(f => f.following), total };
  }

  static async checkFollowStatus(followerId: string, followingId: string): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
    return !!follow;
  }
}