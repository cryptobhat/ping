import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { defaultStringsForPage, SITE_COPY_DEFAULTS } from '../config/site-copy.defaults';

export class SiteCopyService {
  static mergePage(pageKey: string, lang: string, dbStrings: Record<string, string> | null): Record<string, string> {
    const base = { ...defaultStringsForPage(pageKey, lang) };
    if (dbStrings && typeof dbStrings === 'object') {
      for (const [k, v] of Object.entries(dbStrings)) {
        if (typeof v === 'string') base[k] = v;
      }
    }
    return base;
  }

  /** Public: merged strings for requested pages + language */
  static async getMergedForPages(pages: string[], lang: string): Promise<Record<string, Record<string, string>>> {
    const normalizedLang = (lang || 'en').trim().slice(0, 5) || 'en';
    const uniquePages = [...new Set(pages.filter((p) => p && /^[a-z0-9_-]{1,64}$/i.test(p)))];
    if (uniquePages.length === 0) {
      return {};
    }

    const rows = await prisma.siteCopyBundle.findMany({
      where: {
        pageKey: { in: uniquePages },
        language: normalizedLang,
      },
    });

    const byPage = new Map(rows.map((r) => [r.pageKey, r.strings as Record<string, string>]));

    const out: Record<string, Record<string, string>> = {};
    for (const pageKey of uniquePages) {
      const raw = byPage.get(pageKey);
      out[pageKey] = this.mergePage(pageKey, normalizedLang, raw || null);
    }
    return out;
  }

  static listPageKeys(): string[] {
    return Object.keys(SITE_COPY_DEFAULTS);
  }

  /** Admin: all bundles */
  static async listBundles() {
    return prisma.siteCopyBundle.findMany({
      orderBy: [{ pageKey: 'asc' }, { language: 'asc' }],
    });
  }

  static async upsertBundle(pageKey: string, language: string, bodyStrings: Record<string, unknown>) {
    const pk = pageKey.trim().slice(0, 64);
    const lang = language.trim().slice(0, 5);
    if (!pk || !lang) throw new Error('pageKey and language required');
    if (!/^[a-z0-9_-]+$/i.test(pk)) throw new Error('Invalid pageKey');

    if (!bodyStrings || typeof bodyStrings !== 'object' || Array.isArray(bodyStrings)) {
      throw new Error('strings must be a JSON object');
    }
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(bodyStrings)) {
      if (typeof k === 'string' && k.length <= 120 && typeof v === 'string' && v.length <= 2000) {
        cleaned[k] = v;
      }
    }

    return prisma.siteCopyBundle.upsert({
      where: { pageKey_language: { pageKey: pk, language: lang } },
      create: {
        pageKey: pk,
        language: lang,
        strings: cleaned as Prisma.InputJsonValue,
      },
      update: { strings: cleaned as Prisma.InputJsonValue },
    });
  }
}
