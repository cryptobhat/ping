import prisma from '../config/database';
import { AdminRole } from '@prisma/client';

export class AdminService {
  static async getAllUsers(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          phone: true,
          username: true,
          name: true,
          email: true,
          isPremium: true,
          isVerified: true,
          isActive: true,
          isCreator: true,
          isCreatorEligible: true,
          creatorPriceINR: true,
          coinsBalance: true,
          pensBalance: true,
          lastLoginIp: true,
          lastLoginAt: true,
          lastDevice: true,
          loginCount: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  static async createUser(data: { phone: string; name: string; username: string }) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ phone: data.phone }, { username: data.username.toLowerCase() }],
      },
    });

    if (existing) {
      throw new Error('User with this phone or username already exists');
    }

    return prisma.user.create({
      data: {
        ...data,
        username: data.username.toLowerCase(),
        isVerified: true,
      },
    });
  }

  static async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return { message: 'User deactivated' };
  }

  static async updateUser(userId: string, data: {
    name?: string;
    username?: string;
    phone?: string;
    role?: string;
    isPremium?: boolean;
    coinsBalance?: number;
  }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.username !== undefined) updateData.username = data.username.toLowerCase();
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isPremium !== undefined) updateData.isPremium = data.isPremium;
    if (data.coinsBalance !== undefined) updateData.coinsBalance = data.coinsBalance;

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true, phone: true, username: true, name: true, role: true,
        isPremium: true, coinsBalance: true, isVerified: true, isActive: true,
      },
    });
  }

  static async updateContent(contentId: string, data: {
    title?: string;
    description?: string;
    categoryId?: string;
    visibility?: string;
    isDraft?: boolean;
  }) {
    const content = await prisma.content.findUnique({ where: { id: contentId } });
    if (!content) throw new Error("Content not found");

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.isDraft !== undefined) updateData.isDraft = data.isDraft;

    return prisma.content.update({
      where: { id: contentId },
      data: updateData,
      include: {
        author: { select: { id: true, username: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });
  }

  static async setUserVerified(userId: string, isVerified: boolean) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    return prisma.user.update({
      where: { id: userId },
      data: { isVerified },
      select: { id: true, username: true, name: true, isVerified: true },
    });
  }

  static async getAllContent(page: number, limit: number, filter?: { contentType?: string; authorId?: string }) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter?.contentType) where.contentType = filter.contentType;
    if (filter?.authorId) where.authorId = filter.authorId;

    const [content, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          author: { select: { id: true, username: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      }),
      prisma.content.count({ where }),
    ]);

    return { content, total };
  }

  static async deleteContent(contentId: string) {
    await prisma.content.delete({ where: { id: contentId } });
    return { message: 'Content deleted' };
  }

  static async featureContent(contentId: string, featured: boolean) {
    return prisma.content.update({
      where: { id: contentId },
      data: { isFeatured: featured },
    });
  }

  static async setPremiumContent(contentId: string, isPremium: boolean) {
    return prisma.content.update({
      where: { id: contentId },
      data: { isPremium },
    });
  }

  static async createCategory(data: { name: string; slug: string; description?: string; iconUrl?: string }) {
    const existing = await prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new Error('Category with this slug already exists');
    }

    return prisma.category.create({ data });
  }

  static async updateCategory(categoryId: string, data: Partial<{ name: string; description: string; iconUrl: string; isActive: boolean }>) {
    return prisma.category.update({
      where: { id: categoryId },
      data,
    });
  }

  static async deleteCategory(categoryId: string) {
    await prisma.category.update({
      where: { id: categoryId },
      data: { isActive: false },
    });
    return { message: 'Category deactivated' };
  }

  static async createCampaign(data: { name: string; campaignType: string; startDate?: Date; endDate?: Date; metadata?: any }, adminId: string) {
    return prisma.campaign.create({
      data: {
        ...data,
        campaignType: data.campaignType as any,
        createdById: adminId,
      },
    });
  }

  static async getAllCampaigns(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.campaign.count(),
    ]);

    return { campaigns, total };
  }

  static async getAdConfigs() {
    return prisma.adConfig.findMany();
  }

  static async updateAdConfig(adConfigId: string, data: { isEnabled?: boolean; frequencyCap?: number }, adminId: string) {
    return prisma.adConfig.update({
      where: { id: adConfigId },
      data: {
        ...data,
        updatedById: adminId,
        updatedAt: new Date(),
      },
    });
  }

  static async getPricing() {
    const [subscriptions, coinPackages, penPackages] = await Promise.all([
      prisma.subscriptionPlan.findMany(),
      prisma.coinPackage.findMany(),
      prisma.penPackage.findMany(),
    ]);

    return { subscriptions, coinPackages, penPackages };
  }

  static async updateSubscriptionPlanPrice(planId: string, price: number) {
    return prisma.subscriptionPlan.update({
      where: { id: planId },
      data: { price },
    });
  }

  static async createSubscriptionPlan(data: {
    name: string;
    description: string | null;
    price: number;
    durationDays: number;
    isActive: boolean;
  }) {
    return prisma.subscriptionPlan.create({ data });
  }

  static async updateSubscriptionPlan(planId: string, data: {
    name?: string;
    description?: string | null;
    price?: number;
    durationDays?: number;
    isActive?: boolean;
    features?: any;
    displayOrder?: number;
  }) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');
    return prisma.subscriptionPlan.update({
      where: { id: planId },
      data,
    });
  }

  static async deleteSubscriptionPlan(planId: string) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');
    // Check if any active subscriptions use this plan
    const activeCount = await prisma.userSubscription.count({
      where: { planId, isActive: true },
    });
    if (activeCount > 0) {
      throw new Error(`Cannot delete: ${activeCount} active subscriptions use this plan`);
    }
    await prisma.subscriptionPlan.delete({ where: { id: planId } });
    return { message: 'Plan deleted' };
  }

  static async toggleSubscriptionPlan(planId: string) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');
    return prisma.subscriptionPlan.update({
      where: { id: planId },
      data: { isActive: !plan.isActive },
    });
  }

  // ==========================================
  // Site Settings (key-value config)
  // ==========================================

  static async getSettings() {
    const { getEconomyConfig, ECONOMY_KEYS } = await import('./site-config.service');
    const cfg = await getEconomyConfig();
    const result: Record<string, string> = {};
    for (const key of ECONOMY_KEYS) {
      result[key] = String(cfg[key]);
    }
    return result;
  }

  static async updateSettings(settings: Record<string, string>) {
    const { upsertEconomyConfig } = await import('./site-config.service');
    return upsertEconomyConfig(settings);
  }

  // ==========================================
  // Daily Writing Topic
  // ==========================================

  static async setDailyTopic(data: { topic: string; topicKn?: string; description?: string; date?: string }) {
    const entries: Record<string, string> = {
      daily_topic: data.topic,
      daily_topic_date: data.date || new Date().toISOString().split('T')[0],
    };
    if (data.topicKn !== undefined) entries.daily_topic_kn = data.topicKn;
    if (data.description !== undefined) entries.daily_topic_description = data.description;

    for (const [key, value] of Object.entries(entries)) {
      await prisma.siteConfig.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    }

    return entries;
  }

  static async getDailyTopic() {
    const keys = ['daily_topic', 'daily_topic_kn', 'daily_topic_description', 'daily_topic_date'];
    const rows = await prisma.siteConfig.findMany({
      where: { key: { in: keys } },
    });

    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;

    return {
      topic: map.daily_topic || '',
      topicKn: map.daily_topic_kn || '',
      description: map.daily_topic_description || '',
      date: map.daily_topic_date || '',
    };
  }

  // ==========================================
  // Language Config
  // ==========================================

  static async getEnabledLanguages(): Promise<string[]> {
    const config = await prisma.siteConfig.findUnique({ where: { key: 'enabled_languages' } });
    if (!config) return ['kn', 'hi']; // Default: Kannada + Hindi
    return JSON.parse(config.value);
  }

  static async setEnabledLanguages(languages: string[]) {
    await prisma.siteConfig.upsert({
      where: { key: 'enabled_languages' },
      create: { key: 'enabled_languages', value: JSON.stringify(languages) },
      update: { value: JSON.stringify(languages) },
    });
    return languages;
  }

  static async getDuplicateIPs() {
    const results = await prisma.$queryRaw`
      SELECT "lastLoginIp" as ip, COUNT(*)::int as count,
             array_agg("name" || ' (@' || "username" || ')') as users,
             array_agg("id") as user_ids
      FROM users
      WHERE "lastLoginIp" IS NOT NULL AND "lastLoginIp" != ''
      GROUP BY "lastLoginIp"
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
      LIMIT 50
    `;
    return results;
  }

  static async getAnalytics() {
    const [totalUsers, totalContent, totalTransactions, premiumUsers] = await Promise.all([
      prisma.user.count(),
      prisma.content.count(),
      prisma.transaction.count(),
      prisma.user.count({ where: { isPremium: true } }),
    ]);

    const totalRevenue = await prisma.transaction.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    });

    return {
      totalUsers,
      totalContent,
      totalTransactions,
      premiumUsers,
      totalRevenue: totalRevenue._sum.amount || 0,
    };
  }
}