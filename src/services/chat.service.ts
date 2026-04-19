import prisma from '../config/database';

export class ChatService {
  static async getConversations(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: {
          participants: { some: { userId } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          participants: {
            include: {
              user: { select: { id: true, username: true, name: true, profileImage: true } },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.conversation.count({
        where: { participants: { some: { userId } } },
      }),
    ]);

    return { conversations, total };
  }

  static async createConversation(userIds: string[]): Promise<string> {
    if (userIds.length !== 2) {
      throw new Error('Only direct conversations are supported');
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        participants: {
          every: { userId: { in: userIds } },
        },
      },
    });

    if (existing) {
      return existing.id;
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: 'DIRECT',
        participants: {
          create: userIds.map(userId => ({ userId })),
        },
      },
    });

    return conversation.id;
  }

  static async getMessages(conversationId: string, userId: string, page: number, limit: number) {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!participant) {
      throw new Error('Not a participant');
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: { select: { id: true, username: true, name: true, profileImage: true } },
        },
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    await prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date() },
    });

    return { messages: messages.reverse(), total };
  }

  static async sendMessage(conversationId: string, senderId: string, content: string, messageType: string = 'TEXT') {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: senderId },
      },
    });

    if (!participant) {
      throw new Error('Not a participant');
    }

    return prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        messageType: messageType as any,
      },
      include: {
        sender: { select: { id: true, username: true, name: true, profileImage: true } },
      },
    });
  }

  static async markAsRead(conversationId: string, userId: string) {
    return prisma.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: { lastReadAt: new Date() },
    });
  }
}