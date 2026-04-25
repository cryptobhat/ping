export const READING_LANG_KEY = 'kalaloka_reading_lang';

/** Cookie name read by the server in `RootLayout` to set `<html lang>`. */
export const READING_LANG_COOKIE = 'reading-lang';

/** Allowed reading-language codes (kept in sync with `LANGUAGES` below). */
export const ALLOWED_READING_LANGS = [
  'kn', 'hi', 'en', 'ta', 'te', 'mr', 'bn', 'ml', 'gu', 'pa', 'or', 'as',
] as const;

export function isValidReadingLang(code: string | null | undefined): boolean {
  if (!code) return false;
  return (ALLOWED_READING_LANGS as readonly string[]).includes(code);
}

function readCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : '';
}

/** Preserved when /login?next=… sends the user to /welcome first (no reading lang yet). */
export const POST_AUTH_REDIRECT_KEY = 'kalaloka_post_auth_redirect';

export function stashPostAuthRedirect(path: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (path.startsWith('/') && !path.startsWith('//')) {
      sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, path);
    }
  } catch {
    /* ignore */
  }
}

/** Returns stashed path and removes it (call once after sign-in). */
export function takePostAuthRedirect(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
    sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
    if (v && v.startsWith('/') && !v.startsWith('//')) return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function clearPostAuthRedirect(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
  } catch {
    /* ignore */
  }
}

export const LANGUAGES = [
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
] as const;

/** Empty string until the user picks a language on /welcome. */
export function getReadingLang(): string {
  if (typeof window === 'undefined') return '';
  try {
    const fromLs = localStorage.getItem(READING_LANG_KEY)?.trim() || '';
    if (fromLs) return fromLs;
  } catch { /* ignore */ }
  // Fallback to cookie (kept in sync by setReadingLang) so SSR-set cookie
  // is visible even when localStorage is empty (private mode / fresh device).
  try {
    const fromCookie = readCookie(READING_LANG_COOKIE).trim();
    if (fromCookie && isValidReadingLang(fromCookie)) return fromCookie;
  } catch { /* ignore */ }
  return '';
}

export function setReadingLang(code: string): void {
  if (typeof window === 'undefined') return;
  if (!isValidReadingLang(code)) return;
  try {
    localStorage.setItem(READING_LANG_KEY, code);
  } catch { /* ignore */ }
  // Also write cookie so server components (RootLayout) can read it
  // on the next request and emit a correct <html lang>.
  try {
    document.cookie = `${READING_LANG_COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`;
  } catch { /* ignore */ }
}

export function languageLabel(code: string): string {
  const row = LANGUAGES.find((l) => l.code === code);
  return row ? `${row.native} · ${row.name}` : code;
}
