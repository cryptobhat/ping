import prisma from '../config/database';
import { generateDeepLinkCode } from '../utils/response';

export class DeepLinkService {
  static async createDeepLink(entityType: string, entityId: string): Promise<string> {
    const existing = await prisma.deepLink.findFirst({
      where: { entityType, entityId },
    });

    if (existing) {
      return existing.code;
    }

    const code = generateDeepLinkCode();

    await prisma.deepLink.create({
      data: {
        code,
        entityType,
        entityId,
      },
    });

    return code;
  }

  static async resolveDeepLink(code: string): Promise<{ entityType: string; entityId: string } | null> {
    const deepLink = await prisma.deepLink.findUnique({
      where: { code },
    });

    if (!deepLink) {
      return null;
    }

    return {
      entityType: deepLink.entityType,
      entityId: deepLink.entityId,
    };
  }

  static async getContentDeepLink(contentId: string): Promise<{ code: string; url: string }> {
    const code = await this.createDeepLink('content', contentId);
    return {
      code,
      url: `https://app.com/c/${code}`,
    };
  }

  static async getUserDeepLink(userId: string): Promise<{ code: string; url: string }> {
    const code = await this.createDeepLink('user', userId);
    return {
      code,
      url: `https://app.com/u/${code}`,
    };
  }
}