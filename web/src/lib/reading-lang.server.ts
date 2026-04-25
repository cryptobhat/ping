import { cookies } from 'next/headers';
import { READING_LANG_COOKIE, isValidReadingLang } from './reading-lang';

/**
 * Server-side reader for the persisted reading language. Used by `RootLayout`
 * to emit a correct `<html lang>` for SEO + screen readers without flashing
 * the wrong locale on first paint.
 *
 * Defaults to `'kn'` since Kalaloka is Kannada-first.
 */
export async function getServerReadingLang(): Promise<string> {
  try {
    const store = cookies();
    const value = store.get(READING_LANG_COOKIE)?.value;
    if (value && isValidReadingLang(value)) return value;
  } catch {
    // cookies() can throw in non-request contexts (e.g. metadata generation
    // for some routes). Fall through to default.
  }
  return 'kn';
}
