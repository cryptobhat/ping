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

  // ─── Register flow ───
  registerStep1Title: {
    kn: 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ರಚಿಸಿ',
    hi: 'अपनी प्रोफ़ाइल बनाएँ',
    en: 'Create your profile',
  },
  registerStep1Sub: {
    kn: 'ಮೊದಲು ಕೆಲವು ಮೂಲ ಮಾಹಿತಿ',
    hi: 'कुछ बुनियादी जानकारी से शुरू करें',
    en: "Let's start with the basics",
  },
  registerNameLabel: {
    kn: 'ನಿಮ್ಮನ್ನು ಏನೆಂದು ಕರೆಯಲಿ?',
    hi: 'हम आपको क्या कहें?',
    en: 'What should we call you?',
  },
  registerNamePlaceholder: {
    kn: 'ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು',
    hi: 'आपका पूरा नाम',
    en: 'Your full name',
  },
  registerContinue: {
    kn: 'ಮುಂದುವರಿಸಿ',
    hi: 'जारी रखें',
    en: 'Continue',
  },
  registerBack: {
    kn: 'ಹಿಂದೆ',
    hi: 'पीछे',
    en: 'Back',
  },
  registerStep2Title: {
    kn: 'ಬಳಕೆದಾರ ಹೆಸರನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    hi: 'उपयोगकर्ता नाम चुनें',
    en: 'Pick a username',
  },
  registerStep2Sub: {
    kn: 'ಇದರಿಂದ ಇತರರು ನಿಮ್ಮನ್ನು ಹುಡುಕುತ್ತಾರೆ',
    hi: 'इसी से दूसरे आपको ढूँढेंगे',
    en: 'This is how others will find you',
  },
  registerUsernameLabel: {
    kn: 'ಬಳಕೆದಾರ ಹೆಸರು',
    hi: 'उपयोगकर्ता नाम',
    en: 'Username',
  },
  registerUsernamePlaceholder: {
    kn: 'your_username',
    hi: 'your_username',
    en: 'your_username',
  },
  registerUsernameHint: {
    kn: 'ಅಕ್ಷರಗಳು, ಸಂಖ್ಯೆಗಳು, ಅಂಡರ್‌ಸ್ಕೋರ್ ಮಾತ್ರ. ಇದು ನಿಮ್ಮ ಸಾರ್ವಜನಿಕ URL ಆಗಿರುತ್ತದೆ.',
    hi: 'सिर्फ़ अक्षर, संख्या, अंडरस्कोर। यह आपका सार्वजनिक URL होगा।',
    en: 'Letters, numbers, underscores only. This will be your public URL.',
  },
  registerBioLabel: {
    kn: 'ಪರಿಚಯ',
    hi: 'परिचय',
    en: 'Bio',
  },
  registerBioPlaceholder: {
    kn: 'ನಿಮ್ಮ ಬಗ್ಗೆ ಸಂಕ್ಷಿಪ್ತ ಪರಿಚಯ...',
    hi: 'अपने बारे में संक्षेप में...',
    en: 'A short intro about yourself...',
  },
  registerPhoneTitle: {
    kn: 'ನಿಮ್ಮ ಫೋನ್ ನಂಬರ್',
    hi: 'आपका फ़ोन नंबर',
    en: 'Your phone number',
  },
  registerPhoneSub: {
    kn: 'ಖಾತೆ ಮರುಪಡೆಯುವಿಕೆ ಮತ್ತು ಸೂಚನೆಗಳಿಗಾಗಿ',
    hi: 'खाता रिकवरी और सूचनाओं के लिए',
    en: 'For account recovery and notifications',
  },
  registerPhonePlaceholder: {
    kn: 'ಫೋನ್ ನಂಬರ್ ನಮೂದಿಸಿ',
    hi: 'फ़ोन नंबर डालें',
    en: 'Enter phone number',
  },
  registerSendCode: {
    kn: 'ಕೋಡ್ ಕಳುಹಿಸಿ',
    hi: 'कोड भेजें',
    en: 'Send code',
  },
  registerStep3Title: {
    kn: 'ನಿಮ್ಮ ಓದುವ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    hi: 'पढ़ने की भाषा चुनें',
    en: 'Choose your reading language',
  },
  registerLangSub: {
    kn: 'ನಾವು ಮೊದಲು ಈ ಭಾಷೆಯಲ್ಲಿ ವಿಷಯ ತೋರಿಸುತ್ತೇವೆ',
    hi: 'हम पहले इसी भाषा में सामग्री दिखाएँगे',
    en: "We'll show content in this language first",
  },
  registerStep4Title: {
    kn: 'ನಿಮ್ಮ ಆಸಕ್ತಿಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    hi: 'अपनी रुचियाँ चुनें',
    en: 'Pick your interests',
  },
  registerStep4Sub: {
    kn: 'ನಿಮ್ಮ ಫೀಡ್ ಅನ್ನು ರೂಪಿಸಲು ಕನಿಷ್ಠ ೩ ಆಯ್ಕೆಮಾಡಿ',
    hi: 'फ़ीड को बेहतर बनाने के लिए कम से कम 3 चुनें',
    en: 'Pick at least 3 to personalise your feed',
  },
  registerInterestsCounterMax: {
    kn: '/೫ ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ',
    hi: '/5 चुने गए',
    en: '/5 selected',
  },
  registerStep5Title: {
    kn: 'ರೆಫರಲ್ ಕೋಡ್ ಇದೆಯೇ?',
    hi: 'क्या आपके पास रेफ़रल कोड है?',
    en: 'Got a referral code?',
  },
  registerStep5Sub: {
    kn: 'ಇಚ್ಛಾನುಸಾರ — ಮೊದಲ ಪ್ರಕಟಣೆ ನಂತರ ಇಬ್ಬರೂ ಕಾಯಿನ್ ಪಡೆಯಿರಿ',
    hi: 'वैकल्पिक — पहली पोस्ट के बाद दोनों को सिक्के मिलेंगे',
    en: 'Optional — both of you earn coins on your first publish',
  },
  registerSkip: {
    kn: 'ಸದ್ಯಕ್ಕೆ ಬಿಡಿ',
    hi: 'अभी छोड़ें',
    en: 'Skip for now',
  },
  registerFinish: {
    kn: 'ಮುಗಿಸಿ',
    hi: 'पूरा करें',
    en: 'Finish',
  },
  registerStartExploring: {
    kn: 'ಅನ್ವೇಷಿಸಲು ಪ್ರಾರಂಭಿಸಿ',
    hi: 'खोज शुरू करें',
    en: 'Start Exploring',
  },
  registerStepCount: {
    kn: '{total} ರಲ್ಲಿ ಹಂತ {n}',
    hi: '{total} में से चरण {n}',
    en: 'Step {n} of {total}',
  },
  registerSettingUp: {
    kn: 'ನಿಮ್ಮ ಅನುಭವವನ್ನು ಸಿದ್ಧಗೊಳಿಸಲಾಗುತ್ತಿದೆ…',
    hi: 'आपका अनुभव तैयार हो रहा है…',
    en: 'Setting up your experience…',
  },
  registerWhatDoYouEnjoy: {
    kn: 'ನೀವು ಏನು ಆನಂದಿಸುತ್ತೀರಿ?',
    hi: 'आप क्या पसंद करते हैं?',
    en: 'What do you enjoy?',
  },
  registerInterestsHelp: {
    kn: 'ನಿಮ್ಮ ಫೀಡ್ ಅನ್ನು ವೈಯಕ್ತಿಕಗೊಳಿಸಲು ೫ ಆಸಕ್ತಿಗಳವರೆಗೆ ಆಯ್ಕೆಮಾಡಿ',
    hi: 'अपनी फ़ीड को निजी बनाने के लिए 5 तक रुचियाँ चुनें',
    en: 'Pick up to 5 interests to personalize your feed',
  },
  registerChooseIdentity: {
    kn: 'ನಿಮ್ಮ ಗುರುತನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    hi: 'अपनी पहचान चुनें',
    en: 'Choose your identity',
  },
  registerChooseIdentitySub: {
    kn: 'ಅನನ್ಯ ಬಳಕೆದಾರ ಹೆಸರನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ಓದುಗರಿಗೆ ನಿಮ್ಮ ಬಗ್ಗೆ ಹೇಳಿ',
    hi: 'एक यूनिक यूज़रनेम चुनें और पाठकों को अपने बारे में बताएँ',
    en: 'Pick a unique username and tell readers about yourself',
  },
  registerChooseLanguage: {
    kn: 'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    hi: 'अपनी भाषा चुनें',
    en: 'Choose your language',
  },
  registerOptional: {
    kn: '(ಇಚ್ಛಾನುಸಾರ)',
    hi: '(वैकल्पिक)',
    en: '(optional)',
  },

  // ─── Register error messages ───
  registerNameRequired: {
    kn: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರನ್ನು ನಮೂದಿಸಿ',
    hi: 'कृपया अपना नाम दर्ज करें',
    en: 'Please enter your name',
  },
  registerUsernameRequired: {
    kn: 'ದಯವಿಟ್ಟು ಬಳಕೆದಾರ ಹೆಸರನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    hi: 'कृपया एक उपयोगकर्ता नाम चुनें',
    en: 'Please choose a username',
  },
  registerUsernameTooShort: {
    kn: 'ಬಳಕೆದಾರ ಹೆಸರು ಕನಿಷ್ಠ ೩ ಅಕ್ಷರಗಳಾಗಿರಬೇಕು',
    hi: 'उपयोगकर्ता नाम कम से कम 3 अक्षरों का होना चाहिए',
    en: 'Username must be at least 3 characters',
  },
  registerLanguageRequired: {
    kn: 'ದಯವಿಟ್ಟು ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    hi: 'कृपया एक भाषा चुनें',
    en: 'Please pick a language',
  },
  registerInterestsRequired: {
    kn: 'ದಯವಿಟ್ಟು ಕನಿಷ್ಠ ೩ ಆಸಕ್ತಿಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    hi: 'कृपया कम से कम 3 रुचियाँ चुनें',
    en: 'Please pick at least 3 interests',
  },
  registerPhotoUploaded: {
    kn: 'ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಆಯಿತು!',
    hi: 'फ़ोटो अपलोड हो गई!',
    en: 'Photo uploaded!',
  },
  registerPhotoFailed: {
    kn: 'ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ವಿಫಲ',
    hi: 'फ़ोटो अपलोड विफल',
    en: 'Failed to upload photo',
  },
  registerSessionExpired: {
    kn: 'ಸೆಷನ್ ಮುಕ್ತಾಯಗೊಂಡಿದೆ. ಮತ್ತೆ ಲಾಗಿನ್ ಆಗಿ.',
    hi: 'सेशन समाप्त हो गया। फिर से लॉगिन करें।',
    en: 'Session expired. Please login again.',
  },
  registerWelcome: {
    kn: 'Kalaloka ಗೆ ಸ್ವಾಗತ!',
    hi: 'Kalaloka में आपका स्वागत है!',
    en: 'Welcome to Kalaloka!',
  },
  registerSaveFailed: {
    kn: 'ಪ್ರೊಫೈಲ್ ಉಳಿಸಲು ವಿಫಲವಾಗಿದೆ',
    hi: 'प्रोफ़ाइल सहेजने में विफल',
    en: 'Failed to save profile',
  },

  // ─── Author / content sidebar ───
  authorHeading: {
    kn: 'ಲೇಖಕರ ಬಗ್ಗೆ',
    hi: 'लेखक के बारे में',
    en: 'About the Author',
  },
  statsHeading: {
    kn: 'ಅಂಕಿಅಂಶಗಳು',
    hi: 'आँकड़े',
    en: 'Stats',
  },
  followers: {
    kn: 'ಅನುಯಾಯಿಗಳು',
    hi: 'फॉलोअर्स',
    en: 'Followers',
  },
  storiesCount: {
    kn: 'ಕಥೆಗಳು',
    hi: 'कहानियाँ',
    en: 'Stories',
  },
  views: {
    kn: 'ವೀಕ್ಷಣೆಗಳು',
    hi: 'व्यू',
    en: 'Views',
  },
  likes: {
    kn: 'ಇಷ್ಟಗಳು',
    hi: 'लाइक',
    en: 'Likes',
  },
  comments: {
    kn: 'ಕಾಮೆಂಟ್‌ಗಳು',
    hi: 'टिप्पणियाँ',
    en: 'Comments',
  },
  readTime: {
    kn: 'ಓದುವ ಸಮಯ',
    hi: 'पढ़ने का समय',
    en: 'Read Time',
  },
  viewProfile: {
    kn: 'ಪ್ರೊಫೈಲ್ ನೋಡಿ',
    hi: 'प्रोफ़ाइल देखें',
    en: 'View Profile',
  },
  follow: {
    kn: 'ಅನುಸರಿಸಿ',
    hi: 'फ़ॉलो',
    en: 'Follow',
  },
  following: {
    kn: 'ಅನುಸರಿಸುತ್ತಿದ್ದಾರೆ',
    hi: 'फ़ॉलो कर रहे हैं',
    en: 'Following',
  },
  sendGem: {
    kn: 'ಜೆಮ್ ಕಳುಹಿಸಿ',
    hi: 'जेम भेजें',
    en: 'Send a Gem',
  },
  rateAuthor: {
    kn: 'ಲೇಖಕನಿಗೆ ರೇಟ್ ಮಾಡಿ',
    hi: 'लेखक को रेट करें',
    en: 'Rate Author',
  },
  signInToReadFull: {
    kn: 'ಪೂರ್ಣ ಕಥೆ ಓದಲು ಸೈನ್ ಇನ್ ಆಗಿ',
    hi: 'पूरी कहानी पढ़ने के लिए साइन इन करें',
    en: 'Sign in to read the full story',
  },
  signInOrCreate: {
    kn: 'ಸೈನ್ ಇನ್ ಆಗಿ ಅಥವಾ ಖಾತೆ ತೆರೆಯಿರಿ',
    hi: 'साइन इन करें या खाता बनाएँ',
    en: 'Sign in or create account',
  },
  signInToComment: {
    kn: 'ಕಾಮೆಂಟ್ ಮಾಡಲು ಸೈನ್ ಇನ್ ಆಗಿ',
    hi: 'टिप्पणी के लिए साइन इन करें',
    en: 'Sign in to comment',
  },
  noCommentsBeFirst: {
    kn: 'ಇನ್ನೂ ಕಾಮೆಂಟ್‌ಗಳಿಲ್ಲ. ಮೊದಲಿಗರಾಗಿ!',
    hi: 'अभी कोई टिप्पणी नहीं। पहले बनें!',
    en: 'No comments yet. Be the first!',
  },
  signInToReadOrCreate: {
    kn: 'ನಿಮ್ಮ ಫೋನ್ ನಂಬರ್ ಬಳಸಿ — ಕಲಲೋಕ ಆಪ್‌ನಲ್ಲಿ ಇರುವಂತೆ ತ್ವರಿತ OTP.',
    hi: 'अपना फ़ोन नंबर डालें — जल्दी OTP, ऐप जैसा ही.',
    en: 'Use your phone number — quick OTP, same as the Kalaloka app.',
  },
  appreciation: {
    kn: 'ಇಷ್ಟ ಆಯಿತಾ? ನಿಮ್ಮ ಮೆಚ್ಚುಗೆ ತೋರಿಸಿ!',
    hi: 'पसंद आया? अपनी सराहना दिखाएँ!',
    en: 'Enjoyed this? Show your appreciation!',
  },
  relatedStories: {
    kn: 'ಸಂಬಂಧಿತ ಕಥೆಗಳು',
    hi: 'संबंधित कहानियाँ',
    en: 'Related Stories',
  },

  // ─── Leaderboard ───
  leaderboardTitle: {
    kn: 'ಲೀಡರ್‌ಬೋರ್ಡ್',
    hi: 'लीडरबोर्ड',
    en: 'Leaderboard',
  },
  leaderboardSubtitle: {
    kn: 'ಜನಪ್ರಿಯ ಬರಹಗಾರರು ಮತ್ತು ಬೆಳೆಯುತ್ತಿರುವ ತಾರೆಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',
    hi: 'सबसे लोकप्रिय लेखक और उभरते सितारे जानें',
    en: 'Discover the most popular writers and rising stars',
  },
  lbToday: {
    kn: 'ಇಂದು',
    hi: 'आज',
    en: 'Today',
  },
  lbWeek: {
    kn: 'ವಾರ',
    hi: 'सप्ताह',
    en: 'Week',
  },
  lbMonth: {
    kn: 'ತಿಂಗಳು',
    hi: 'महीना',
    en: 'Month',
  },
  lbAllTime: {
    kn: 'ಎಲ್ಲ ಸಮಯ',
    hi: 'सभी समय',
    en: 'All Time',
  },
  lbEarners: {
    kn: 'ಆದಾಯ ಗಳಿಸುವವರು',
    hi: 'कमाने वाले',
    en: 'Earners',
  },
  lbRising: {
    kn: 'ಏರುತ್ತಿರುವ',
    hi: 'उभरते',
    en: 'Rising',
  },
  lbNoData: {
    kn: 'ಇನ್ನೂ ಡೇಟಾ ಇಲ್ಲ',
    hi: 'अभी कोई डेटा नहीं',
    en: 'No data yet',
  },
  lbNoDataSub: {
    kn: 'ಬರಹಗಾರರು ಪ್ರಕಟಿಸುತ್ತಿದ್ದಂತೆ ಲೀಡರ್‌ಬೋರ್ಡ್ ತುಂಬುತ್ತದೆ.',
    hi: 'जैसे-जैसे लेखक प्रकाशित करेंगे, लीडरबोर्ड भर जाएगा.',
    en: 'The leaderboard will populate as writers publish content.',
  },

  // ─── 404 / not found ───
  notFound404: {
    kn: 'ಪುಟ ಸಿಗಲಿಲ್ಲ',
    hi: 'पेज नहीं मिला',
    en: 'Page not found',
  },
  notFoundSub: {
    kn: 'ನೀವು ಹುಡುಕುತ್ತಿರುವ ಪುಟ ಇಲ್ಲ ಅಥವಾ ಚಲಿಸಲಾಗಿದೆ. ನಿಮ್ಮನ್ನು ಮರಳಿ ಕರೆದೊಯ್ಯೋಣ.',
    hi: 'जो पेज आप ढूँढ रहे हैं वह मौजूद नहीं है या स्थानांतरित हो गया है. आइए वापस सही रास्ते पर लाते हैं.',
    en: "The page you're looking for doesn't exist or has been moved. Let's get you back on track.",
  },
  goHome: {
    kn: 'ಮುಖಪುಟಕ್ಕೆ ಹೋಗಿ',
    hi: 'मुखपृष्ठ पर जाएँ',
    en: 'Go home',
  },
  discoverStories: {
    kn: 'ಕಥೆಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',
    hi: 'कहानियाँ खोजें',
    en: 'Discover stories',
  },

  // ─── Login bullets / referral ───
  loginBullet1: {
    kn: 'ಕನ್ನಡ, ಹಿಂದಿ, ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಕಥೆ, ಕವನ ಮತ್ತು ಲೇಖನಗಳನ್ನು ಓದಿ',
    hi: 'कन्नड़, हिंदी, अंग्रेज़ी में कहानियाँ, कविताएँ और लेख पढ़ें',
    en: 'Read stories, poems & articles in Kannada, Hindi, English',
  },
  loginBullet2: {
    kn: 'ನಿಮ್ಮ ಮಾತೃಭಾಷೆಯಲ್ಲಿ ಬರೆದು ಓದುಗರನ್ನು ರೂಪಿಸಿ',
    hi: 'अपनी मातृभाषा में लिखें और पाठक बनाएँ',
    en: 'Write in your mother tongue and build a readership',
  },
  loginBullet3: {
    kn: 'ವಾರದ ಬರಹ ಸ್ಪರ್ಧೆಗಳ ಮೂಲಕ ನಗದು ಬಹುಮಾನ ಗೆಲ್ಲಿ',
    hi: 'साप्ताहिक लेखन प्रतियोगिताओं में नकद पुरस्कार जीतें',
    en: 'Win cash prizes through weekly writing contests',
  },
  referralCodeLabel: {
    kn: 'ರೆಫರಲ್ ಕೋಡ್',
    hi: 'रेफ़रल कोड',
    en: 'Referral code',
  },
  optional: {
    kn: 'ಇಚ್ಛಾನುಸಾರ',
    hi: 'वैकल्पिक',
    en: 'optional',
  },
  enterReferralCode: {
    kn: 'ರೆಫರಲ್ ಕೋಡ್ ನಮೂದಿಸಿ',
    hi: 'रेफ़रल कोड डालें',
    en: 'Enter referral code',
  },
  referralRewardsHint: {
    kn: 'ಹೊಸ ಖಾತೆಯು ಮೊದಲ ಪೋಸ್ಟ್ ಪ್ರಕಟಿಸಿ ಧೋಖಾಧಡಿ ಚೆಕ್ಸ್‌ಗಳನ್ನು ದಾಟಿದ ನಂತರವೇ ರೆಫರಲ್ ಬಹುಮಾನ ತೆರೆಯುತ್ತದೆ.',
    hi: 'नई अकाउंट पहली पोस्ट प्रकाशित कर धोखाधड़ी जाँच पास करने के बाद ही रेफ़रल पुरस्कार खुलता है.',
    en: 'Referral rewards unlock only after the new account publishes its first post and passes fraud checks.',
  },
  newToKalaloka: {
    kn: 'ಕಲಲೋಕಕ್ಕೆ ಹೊಸಬರೇ?',
    hi: 'कलालोक पर नए हैं?',
    en: 'New to Kalaloka?',
  },
  createAccount: {
    kn: 'ಖಾತೆ ತೆರೆಯಿರಿ',
    hi: 'खाता बनाएँ',
    en: 'Create an account',
  },

  // ─── Home sections ───
  homeTopRated: {
    kn: 'ಅತ್ಯುತ್ತಮ ರೇಟಿಂಗ್',
    hi: 'टॉप रेटेड',
    en: 'Top Rated',
  },
  homeTopRatedSub: {
    kn: 'ಅತ್ಯುತ್ತಮ ರೇಟಿಂಗ್ ಬರಹಗಾರರ ಕಥೆಗಳು',
    hi: 'सर्वोच्च रेटिंग वाले लेखकों की कहानियाँ',
    en: 'Stories from the highest-rated authors',
  },
  homePopularStories: {
    kn: 'ಜನಪ್ರಿಯ ಕಥೆಗಳು',
    hi: 'लोकप्रिय कहानियाँ',
    en: 'Popular stories',
  },
  homePopularArticles: {
    kn: 'ಜನಪ್ರಿಯ ಲೇಖನಗಳು',
    hi: 'लोकप्रिय लेख',
    en: 'Popular articles',
  },
  homeRisingAuthors: {
    kn: 'ಏರುತ್ತಿರುವ ಬರಹಗಾರರು',
    hi: 'उभरते लेखक',
    en: 'Rising Authors',
  },
  homeRisingAuthorsSub: {
    kn: 'ಈ ತಿಂಗಳ ಹೊಸ ಧ್ವನಿಗಳು',
    hi: 'इस महीने की नई आवाज़ें',
    en: 'New voices this month',
  },
  seeMore: {
    kn: 'ಇನ್ನಷ್ಟು ತೋರಿಸಿ',
    hi: 'और देखें',
    en: 'See more',
  },
  homeTrendingTopics: {
    kn: 'ಜನಪ್ರಿಯ ವಿಷಯಗಳು',
    hi: 'ट्रेंडिंग विषय',
    en: 'Trending Topics',
  },

  // ─── Footer ───
  footerProduct: {
    kn: 'ಉತ್ಪನ್ನ',
    hi: 'उत्पाद',
    en: 'PRODUCT',
  },
  footerSupport: {
    kn: 'ಬೆಂಬಲ',
    hi: 'सहायता',
    en: 'SUPPORT',
  },
  footerLegal: {
    kn: 'ಕಾನೂನು',
    hi: 'क़ानूनी',
    en: 'LEGAL',
  },
  footerDiscover: {
    kn: 'ಅನ್ವೇಷಿಸಿ',
    hi: 'खोजें',
    en: 'Discover',
  },
  footerCompetitions: {
    kn: 'ಸ್ಪರ್ಧೆಗಳು',
    hi: 'प्रतियोगिताएँ',
    en: 'Competitions',
  },
  footerPremium: {
    kn: 'ಪ್ರೀಮಿಯಂ',
    hi: 'प्रीमियम',
    en: 'Premium',
  },
  footerLeaderboard: {
    kn: 'ಲೀಡರ್‌ಬೋರ್ಡ್',
    hi: 'लीडरबोर्ड',
    en: 'Leaderboard',
  },
  footerHelp: {
    kn: 'ಸಹಾಯ ಮತ್ತು FAQ',
    hi: 'मदद और FAQ',
    en: 'Help & FAQ',
  },
  footerAbout: {
    kn: 'ನಮ್ಮ ಬಗ್ಗೆ',
    hi: 'हमारे बारे में',
    en: 'About',
  },
  footerContact: {
    kn: 'ಸಂಪರ್ಕಿಸಿ',
    hi: 'संपर्क',
    en: 'Contact',
  },
  footerGuidelines: {
    kn: 'ಮಾರ್ಗಸೂಚಿಗಳು',
    hi: 'दिशानिर्देश',
    en: 'Guidelines',
  },
  footerTerms: {
    kn: 'ನಿಯಮಗಳು',
    hi: 'शर्तें',
    en: 'Terms',
  },
  footerPrivacy: {
    kn: 'ಗೌಪ್ಯತೆ',
    hi: 'गोपनीयता',
    en: 'Privacy',
  },
  footerCopyright: {
    kn: 'ಕಾಪಿರೈಟ್',
    hi: 'कॉपीराइट',
    en: 'Copyright',
  },
  footerRefund: {
    kn: 'ಮರುಪಾವತಿ',
    hi: 'रिफ़ंड',
    en: 'Refund',
  },
  footerGrievance: {
    kn: 'ದೂರು ಪರಿಹಾರ',
    hi: 'शिकायत निवारण',
    en: 'Grievance',
  },

  // ─── Content type badges ───
  cardStory: {
    kn: 'ಕಥೆ',
    hi: 'कहानी',
    en: 'Story',
  },
  cardPoem: {
    kn: 'ಕವನ',
    hi: 'कविता',
    en: 'Poem',
  },
  cardArticle: {
    kn: 'ಲೇಖನ',
    hi: 'लेख',
    en: 'Article',
  },
} as const;

export type CopyKey = keyof typeof STRINGS;

/** Resolve a microcopy string for the given locale, falling back to en. */
export function t(key: CopyKey, locale: string | null | undefined): string {
  const map = STRINGS[key] as CopyMap;
  const code = (locale || 'en') as CopyLocale;
  return map[code] ?? map.en;
}
