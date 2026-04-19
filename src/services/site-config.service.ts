import prisma from '../config/database';

/**
 * Economy config defaults — all stored in the SiteConfig table (key-value).
 * Admin can change any of these from the admin panel.
 */
const ECONOMY_DEFAULTS: Record<string, string> = {
  reading_reward_coins: '2',
  daily_coin_cap: '20',
  completion_bonus: '5',
  streak_bonus_7day: '10',
  referral_reward: '0',
  min_withdrawal_coins: '400',
  coins_per_rupee: '10',
  platform_commission_percent: '30',
};

/** All economy-related keys that the admin can edit. */
export const ECONOMY_KEYS = Object.keys(ECONOMY_DEFAULTS);

/**
 * Read a single SiteConfig value, falling back to the coded default.
 */
export async function getConfigValue(key: string): Promise<string> {
  const row = await prisma.siteConfig.findUnique({ where: { key } });
  return row?.value ?? ECONOMY_DEFAULTS[key] ?? '';
}

/**
 * Read a numeric SiteConfig value (common case for economy).
 */
export async function getConfigNumber(key: string): Promise<number> {
  const val = await getConfigValue(key);
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

/**
 * Read all economy config values at once (fewer DB round-trips).
 */
export async function getEconomyConfig(): Promise<Record<string, number>> {
  const rows = await prisma.siteConfig.findMany({
    where: { key: { in: ECONOMY_KEYS } },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  const result: Record<string, number> = {};
  for (const key of ECONOMY_KEYS) {
    const raw = map[key] ?? ECONOMY_DEFAULTS[key] ?? '0';
    result[key] = parseFloat(raw) || 0;
  }
  return result;
}

/**
 * Upsert multiple SiteConfig entries. Only allows known economy keys.
 */
export async function upsertEconomyConfig(settings: Record<string, string>): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  for (const [key, value] of Object.entries(settings)) {
    if (!ECONOMY_KEYS.includes(key)) continue;

    // Validate numeric
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      throw new Error(`${key} must be a non-negative number`);
    }
    if (key === 'platform_commission_percent' && num > 100) {
      throw new Error('Commission must be between 0 and 100');
    }

    await prisma.siteConfig.upsert({
      where: { key },
      create: { key, value: String(num) },
      update: { value: String(num) },
    });
    results[key] = String(num);
  }
  return results;
}
