/**
 * MVP fallback copy when DB has no row. Admin overrides merge on top (per key).
 * pageKey -> language code -> key -> string
 */
export const SITE_COPY_DEFAULTS: Record<string, Record<string, Record<string, string>>> = {
  home: {
    en: {
      metaTitle: 'Kalaloka — Read and write in your language',
      bannerTitle: 'Discover stories in your language',
      bannerSubtitle: 'Browse series, poems, and articles from Indian writers.',
      bannerCta: 'Open discover',
      trendingTitle: 'Trending now',
      trendingSubtitle: 'What readers are opening today',
      seriesTitle: 'Top trending series',
      seriesSubtitle: 'Most popular this week',
      categoriesTitle: 'Explore categories',
      writersTitle: 'Featured writers',
      writersSubtitle: 'Creators to follow',
      newStoriesTitle: 'New stories',
      newStoriesSubtitle: 'Fresh reads',
      poemsTitle: 'Poems',
      poemsSubtitle: 'Short reads, deep feelings',
      popularSeriesTitle: 'Popular series',
      popularSeriesSubtitle: 'Multi-part stories',
      articlesTitle: 'Articles',
      articlesSubtitle: 'Long-form reads',
      premiumTitle: 'Go premium',
      premiumSubtitle: 'Ad-light reading and more perks for serious readers',
      premiumCta: 'View plans',
      emptyFeed: 'Nothing here yet — check Discover or try another language.',
    },
    hi: {
      metaTitle: 'Kalaloka — अपनी भाषा में पढ़ें और लिखें',
      trendingTitle: 'अभी ट्रेंडिंग',
      trendingSubtitle: 'आज पाठक क्या पढ़ रहे हैं',
      seriesTitle: 'टॉप सीरीज़',
      seriesSubtitle: 'इस हफ्ते सबसे लोकप्रिय',
      categoriesTitle: 'श्रेणियाँ देखें',
      writersTitle: 'लोकप्रिय लेखक',
      writersSubtitle: 'जिन्हें फॉलो करें',
      newStoriesTitle: 'नई कहानियाँ',
      newStoriesSubtitle: 'ताज़ा पढ़ने के लिए',
      poemsTitle: 'कविताएँ',
      poemsSubtitle: 'छोटी रचनाएँ, गहरे एहसास',
      popularSeriesTitle: 'लोकप्रिय सीरीज़',
      popularSeriesSubtitle: 'कई हिस्सों वाली कहानियाँ',
      articlesTitle: 'लेख',
      articlesSubtitle: 'लंबी पढ़ाई',
      premiumTitle: 'प्रीमियम',
      premiumSubtitle: 'कम विज्ञापन, बेहतर अनुभव',
      premiumCta: 'प्लान देखें',
      emptyFeed: 'अभी कुछ नहीं — डिस्कवर देखें या भाषा बदलें।',
    },
    kn: {
      metaTitle: 'Kalaloka — ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಓದಿ, ಬರೆಯಿರಿ',
      trendingTitle: 'ಟ್ರೆಂಡಿಂಗ್',
      trendingSubtitle: 'ಇಂದು ಓದುಗರು ಏನು ಓದುತ್ತಿದ್ದಾರೆ',
      seriesTitle: 'ಜನಪ್ರಿಯ ಸೀರೀಸ್',
      seriesSubtitle: 'ಈ ವಾರ ಹೆಚ್ಚು ಓದಿದವು',
      categoriesTitle: 'ವರ್ಗಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',
      writersTitle: 'ವಿಶೇಷ ಲೇಖಕರು',
      writersSubtitle: 'ಫಾಲೋ ಮಾಡಲು',
      newStoriesTitle: 'ಹೊಸ ಕಥೆಗಳು',
      newStoriesSubtitle: 'ತಾಜಾ ಓದುಗಳು',
      poemsTitle: 'ಕವನಗಳು',
      poemsSubtitle: 'ಚಿಕ್ಕ ಓದು, ಆಳವಾದ ಭಾವನೆ',
      popularSeriesTitle: 'ಜನಪ್ರಿಯ ಸೀರೀಸ್',
      popularSeriesSubtitle: 'ಹಲವು ಭಾಗಗಳ ಕಥೆಗಳು',
      articlesTitle: 'ಲೇಖನಗಳು',
      articlesSubtitle: 'ದೀರ್ಘ ಓದು',
      premiumTitle: 'ಪ್ರೀಮಿಯಂ',
      premiumSubtitle: 'ಕಡಿಮೆ ಜಾಹೀರಾತು, ಉತ್ತಮ ಅನುಭವ',
      premiumCta: 'ಯೋಜನೆಗಳು',
      emptyFeed: 'ಇನ್ನೂ ಏನೂ ಇಲ್ಲ — ಡಿಸ್ಕವರ್ ಅಥವಾ ಭಾಷೆ ಬದಲಿಸಿ.',
    },
  },
  welcome: {
    en: {
      headline: 'Which language do you read in?',
      sub: 'We personalize your feed. Change anytime from the sidebar.',
      startLabel: 'Start here',
    },
    hi: {
      headline: 'आप किस भाषा में पढ़ते हैं?',
      sub: 'हम आपका फ़ीड निजी बनाते हैं। साइडबार से कभी बदलें।',
      startLabel: 'यहाँ से शुरू',
    },
    kn: {
      headline: 'ನೀವು ಯಾವ ಭಾಷೆಯಲ್ಲಿ ಓದುತ್ತೀರಿ?',
      sub: 'ನಿಮ್ಮ ಫೀಡ್ ವೈಯಕ್ತಿಕಗೊಳಿಸುತ್ತೇವೆ। ಸೈಡ್‌ಬಾರ್‌ನಿಂದ ಬದಲಿಸಿ.',
      startLabel: 'ಇಲ್ಲಿಂದ ಪ್ರಾರಂಭ',
    },
  },
};

export const SUPPORTED_COPY_LANGS = ['en', 'hi', 'kn', 'ta', 'te', 'mr', 'bn', 'gu', 'ml', 'pa', 'ur'] as const;

export function defaultStringsForPage(pageKey: string, lang: string): Record<string, string> {
  const page = SITE_COPY_DEFAULTS[pageKey];
  if (!page) return {};
  return page[lang] || page.en || {};
}
