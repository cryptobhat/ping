import prisma from '../../config/database';

export type LexiconRow = {
  rawToken: string;
  normalizedToken: string;
  spokenOverride: string | null;
  dialect: string;
  notes: string | null;
  priority: number;
};

/**
 * Pluggable lexicon: default loads from DB; callers may pass overrides for tests.
 */
export class LexiconService {
  static async fetchForDialect(dialect: string = 'general'): Promise<LexiconRow[]> {
    const rows = await prisma.pronunciationLexicon.findMany({
      where: {
        OR: [{ dialect }, { dialect: 'general' }],
      },
      orderBy: [{ priority: 'desc' }, { rawToken: 'asc' }],
      take: 2000,
    });
    return rows.map((r) => ({
      rawToken: r.rawToken,
      normalizedToken: r.normalizedToken,
      spokenOverride: r.spokenOverride,
      dialect: r.dialect,
      notes: r.notes,
      priority: r.priority,
    }));
  }

  static toPromptJson(rows: LexiconRow[]): string {
    return JSON.stringify(
      rows.map((r) => ({
        raw_token: r.rawToken,
        normalized_token: r.normalizedToken,
        spoken_override: r.spokenOverride,
        dialect: r.dialect,
        notes: r.notes,
      })),
      null,
      0
    );
  }
}
