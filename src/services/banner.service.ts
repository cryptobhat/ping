import prisma from '../config/database';

export class BannerService {
  static async getActive() {
    const now = new Date();
    return prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  static async getAll() {
    return prisma.banner.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  static async create(data: {
    title?: string;
    subtitle?: string;
    imageUrl?: string;
    deepLink?: string;
    link?: string;
    sortOrder?: number;
    isActive?: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
  }) {
    return prisma.banner.create({ data });
  }

  static async update(id: string, data: any) {
    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new Error('Banner not found');
    return prisma.banner.update({ where: { id }, data });
  }

  static async delete(id: string) {
    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new Error('Banner not found');
    await prisma.banner.delete({ where: { id } });
    return { message: 'Banner deleted' };
  }
}
