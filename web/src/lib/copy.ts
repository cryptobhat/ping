/**
 * Client-side UX microcopy for strings not yet covered by the server-driven
 * site-copy API (`fetchSiteCopy` in `site-copy.ts`).
 *
 * Keep these next to the component when possible. This file is the catch-all
 * for shared microcopy (banners, modals, welcome) so a translator can find
 * them in one place. Once a string graduates to server-driven copy, remove
 * it from here.
 *
 * Locales follow ALLOWED_READING_LANGS in `reading-lang.ts`. Today we ship
 * kn/hi/en — others fall back to en until translations land.
 */

export type CopyLocale = 'kn' | 'hi' | 'en';

type CopyMap = Record<CopyLocale, string>;

const STRINGS = {
  // Home — empty feed (when a language has no stories yet)
  homeEmptyFeed: {
    kn: 'ಈ ಭಾಷೆಯಲ್ಲಿ ಇನ್ನೂ ಕಥೆಗಳಿಲ್ಲ. Discover ನೋಡಿ ಅಥವಾ ಭಾಷೆ ಬದಲಿಸಿ.',
    hi: 'इस भाषा में अभी कहानियाँ नहीं हैं. Discover देखें या भाषा बदलें.',
    en: "We don't have stories in this language yet. Browse Discover or switch language to find more.",
  },

  // Welcome — sub-headline (replaces the long sign-in-context paragraph)
  welcomePickLanguage: {
    kn: 'ನಿಮ್ಮ ಭಾಷೆ ಆರಿಸಿ. ಮೊದಲಿನಿಂದಲೇ ಆ ಭಾಷೆಯ ಕಥೆಗಳು ತೋರಿಸುತ್ತೇವೆ.',
    hi: 'अपनी भाषा चुनें. शुरू से ही उसी भाषा की कहानियाँ दिखेंगी.',
    en: "Pick your language. We'll show stories in it from the start.",
  },

  // SmartAppBanner — value prop
  appBannerValueProp: {
    kn: 'ಆಫ್‌ಲೈನ್ ಓದಿ + ವೇಗವಾಗಿ ಲೋಡ್ — Kalaloka ಆ್ಯಪ್ ಪಡೆಯಿರಿ.',
    hi: 'ऑफ़लाइन पढ़ें + तेज़ लोड — Kalaloka ऐप पाएँ.',
    en: 'Read offline + faster load — get the Kalaloka app.',
  },

  // SubscriptionModal — chai analogy headline
  subChaiHeadline: {
    kn: 'ಒಂದು ಚಹಾಕ್ಕಿಂತ ಕಡಿಮೆ ☕ — ತಿಂಗಳಿಗೆ ₹11',
    hi: 'एक चाय से भी सस्ता ☕ — ₹11/महीना',
    en: 'Less than a cup of chai ☕ — ₹11/month',
  },
} as const;

export type CopyKey = keyof typeof STRINGS;

/** Resolve a microcopy string for the given locale, falling back to en. */
export function t(key: CopyKey, locale: string | null | undefined): string {
  const map = STRINGS[key] as CopyMap;
  const code = (locale || 'en') as CopyLocale;
  return map[code] ?? map.en;
}
