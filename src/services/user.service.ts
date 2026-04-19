import prisma from '../config/database';
import { publicContentListSelect, toPublicContentListItem } from './content.service';
import { User } from '@prisma/client';

interface UserUpdate {
  name?: string;
  phone?: string;
  bio?: string;
  profileImage?: string;
  coverImage?: string;
  visibility?: string;
  language?: string;
  location?: string;
  website?: string;
}

export class UserService {
  static async getUserById(id: string): Promise<
    | (Partial<User> & { followersCount: number; followingCount: number; contentCount: number })
    | null
  > {
    const row = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        username: true,
        name: true,
        bio: true,
        profileImage: true,
        dob: true,
        visibility: true,
        isPremium: true,
        coinsBalance: true,
        pensBalance: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            content: true,
          },
        },
      },
    });
    if (!row) return null;
    const { _count, ...rest } = row;
    return {
      ...rest,
      followersCount: _count.following,
      followingCount: _count.followers,
      contentCount: _count.content,
    };
  }

  static async getUserByUsername(username: string, currentUserId?: string): Promise<
    | (Partial<User> & {
        isFollowing?: boolean;
        followersCount: number;
        followingCount: number;
        contentCount: number;
      })
    | null
  > {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        profileImage: true,
        coverImage: true,
        website: true,
        location: true,
        visibility: true,
        isPremium: true,
        isVerified: true,
        isCreator: true,
        creatorPriceINR: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            content: true,
          },
        },
      },
    });

    if (!user || (user.visibility === 'private' && user.id !== currentUserId)) {
      return null;
    }

    let isFollowing = false;
    if (currentUserId) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    const { _count, ...rest } = user;
    // Prisma User.followers = rows where this user is the follower (outgoing); User.following = incoming fans.
    // Expose English labels: followersCount = fans, followingCount = accounts this user follows.
    return {
      ...rest,
      isFollowing,
      followersCount: _count.following,
      followingCount: _count.followers,
      contentCount: _count.content,
    };
  }

  static async updateUser(id: string, data: UserUpdate): Promise<Partial<User>> {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        phone: true,
        username: true,
        name: true,
        bio: true,
        profileImage: true,
        dob: true,
        visibility: true,
        isPremium: true,
      },
    });
  }

  static async updateUsername(id: string, username: string): Promise<Partial<User>> {
    const existing = await prisma.user.findFirst({
      where: { username: username.toLowerCase(), NOT: { id } },
    });

    if (existing) {
      throw new Error('Username already taken');
    }

    return prisma.user.update({
      where: { id },
      data: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
      },
    });
  }

  static async getWalletBalance(id: string): Promise<{ coins: number; pens: number }> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { coinsBalance: true, pensBalance: true },
    });

    return {
      coins: user?.coinsBalance || 0,
      pens: user?.pensBalance || 0,
    };
  }

  static async getUserContent(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      prisma.content.findMany({
        where: { authorId: userId, visibility: 'PUBLIC', isDraft: false },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: publicContentListSelect,
      }),
      prisma.content.count({
        where: { authorId: userId, visibility: 'PUBLIC', isDraft: false },
      }),
    ]);

    const content = rows.map((row) => toPublicContentListItem(row as unknown as Record<string, unknown>));

    return { content, total };
  }
}