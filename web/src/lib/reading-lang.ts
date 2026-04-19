export const READING_LANG_KEY = 'kalaloka_reading_lang';

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
    return localStorage.getItem(READING_LANG_KEY)?.trim() || '';
  } catch {
    return '';
  }
}

export function setReadingLang(code: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(READING_LANG_KEY, code);
  } catch { /* ignore */ }
}

export function languageLabel(code: string): string {
  const row = LANGUAGES.find((l) => l.code === code);
  return row ? `${row.native} · ${row.name}` : code;
}
