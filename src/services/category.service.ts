import prisma from '../config/database';
import { publicContentListSelect, toPublicContentListItem } from './content.service';

export class CategoryService {
  static async getAllCategories() {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
      include: {
        children: true,
      },
    });
  }

  static async getCategoryById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
      },
    });
  }

  static async getCategoryBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug },
      include: {
        children: true,
      },
    });
  }

  static async getCategoryContent(categoryId: string, page: number, limit: number, language?: string) {
    const skip = (page - 1) * limit;

    const where: any = { categoryId, visibility: 'PUBLIC', isDraft: false };
    if (language) where.language = language;

    const [rows, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: publicContentListSelect,
      }),
      prisma.content.count({ where }),
    ]);

    const content = rows.map((row) => toPublicContentListItem(row as unknown as Record<string, unknown>));

    return { content, total };
  }
}