import { AiService } from '../ai.service';

const DEBOUNCE_MS = parseInt(process.env.USER_INTEREST_DEBOUNCE_MS || '2500', 10);
const pending = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Debounced refresh of UserInterest from reading history (likes/bookmarks fire this too).
 */
export function scheduleUserInterestRefresh(userId: string): void {
  const existing = pending.get(userId);
  if (existing) clearTimeout(existing);
  const t = setTimeout(() => {
    pending.delete(userId);
    AiService.updateUserInterests(userId).catch(() => {});
  }, DEBOUNCE_MS);
  pending.set(userId, t);
}
