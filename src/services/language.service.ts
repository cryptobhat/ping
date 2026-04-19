import prisma from '../config/database';

export class LanguageService {
  static async getLanguages() {
    return prisma.language.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  static async getDefaultLanguage() {
    return prisma.language.findFirst({
      where: { isDefault: true },
    });
  }

  static async createLanguage(data: { code: string; name: string; nativeName?: string }) {
    return prisma.language.create({
      data: {
        ...data,
        isActive: true,
      },
    });
  }

  static async updateLanguage(id: string, data: Partial<{ name: string; nativeName: string; isActive: boolean; isDefault: boolean }>) {
    if (data.isDefault) {
      await prisma.language.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.language.update({
      where: { id },
      data,
    });
  }
}

export class ContentTranslationService {
  static async getTranslations(contentId: string) {
    return prisma.contentTranslation.findMany({
      where: { contentId },
      include: {
        content: { select: { id: true, title: true, body: true } },
      },
    });
  }

  static async getTranslation(contentId: string, languageCode: string) {
    return prisma.contentTranslation.findUnique({
      where: { contentId_languageCode: { contentId, languageCode } },
    });
  }

  static async createTranslation(
    contentId: string,
    languageCode: string,
    data: { title?: string; body: string; isAutoTranslated?: boolean },
    translatedBy?: string
  ) {
    return prisma.contentTranslation.create({
      data: {
        contentId,
        languageCode,
        title: data.title,
        body: data.body,
        isAutoTranslated: data.isAutoTranslated || false,
        translatedBy,
      },
    });
  }

  static async updateTranslation(contentId: string, languageCode: string, data: { title?: string; body: string }) {
    return prisma.contentTranslation.update({
      where: { contentId_languageCode: { contentId, languageCode } },
      data,
    });
  }

  static async deleteTranslation(contentId: string, languageCode: string) {
    return prisma.contentTranslation.delete({
      where: { contentId_languageCode: { contentId, languageCode } },
    });
  }
}