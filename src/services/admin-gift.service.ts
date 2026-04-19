import prisma from '../config/database';

export type AdminGiftInput = {
  name: string;
  description?: string | null;
  penValue: number;
  iconEmoji?: string | null;
  imageUrl?: string | null;
  animationUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export class AdminGiftService {
  static async listAll() {
    return prisma.gift.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  static async create(data: AdminGiftInput) {
    const penValue = Math.floor(Number(data.penValue));
    if (!data.name?.trim() || penValue < 1) {
      throw new Error('Name and coin price (min 1) are required');
    }
    return prisma.gift.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        penValue,
        iconEmoji: data.iconEmoji?.trim() || null,
        imageUrl: data.imageUrl?.trim() || null,
        animationUrl: data.animationUrl?.trim() || null,
        sortOrder: data.sortOrder != null ? Math.floor(data.sortOrder) : 0,
        isActive: data.isActive !== false,
      },
    });
  }

  static async update(id: string, data: Partial<AdminGiftInput>) {
    const existing = await prisma.gift.findUnique({ where: { id } });
    if (!existing) throw new Error('Gift not found');

    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = String(data.name).trim();
    if (data.description !== undefined) patch.description = data.description?.trim() || null;
    if (data.penValue !== undefined) {
      const v = Math.floor(Number(data.penValue));
      if (v < 1) throw new Error('penValue must be at least 1');
      patch.penValue = v;
    }
    if (data.iconEmoji !== undefined) patch.iconEmoji = data.iconEmoji?.trim() || null;
    if (data.imageUrl !== undefined) patch.imageUrl = data.imageUrl?.trim() || null;
    if (data.animationUrl !== undefined) patch.animationUrl = data.animationUrl?.trim() || null;
    if (data.sortOrder !== undefined) patch.sortOrder = Math.floor(Number(data.sortOrder));
    if (data.isActive !== undefined) patch.isActive = Boolean(data.isActive);

    return prisma.gift.update({
      where: { id },
      data: patch as any,
    });
  }

  static async delete(id: string) {
    const existing = await prisma.gift.findUnique({ where: { id } });
    if (!existing) throw new Error('Gift not found');
    await prisma.gift.delete({ where: { id } });
  }
}
