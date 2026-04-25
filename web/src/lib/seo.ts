import { Metadata } from 'next';
import { stripHtml } from '@/lib/html-utils';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalaloka.buzz';
const SITE_NAME = 'Kalaloka';
const DEFAULT_DESCRIPTION = 'Write, read, and connect with stories, poems, and articles in 11+ Indian languages. Join a community of passionate writers and readers.';
const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`;

// Map a 2-letter language code to a BCP-47 tag suitable for `inLanguage` /
// schema.org. We default to the Indian region for our supported languages.
const BCP47_BY_LANG: Record<string, string> = {
  kn: 'kn-IN', hi: 'hi-IN', en: 'en-IN', ta: 'ta-IN', te: 'te-IN',
  mr: 'mr-IN', bn: 'bn-IN', ml: 'ml-IN', gu: 'gu-IN', pa: 'pa-IN',
  or: 'or-IN', as: 'as-IN', ur: 'ur-IN',
};

// Map a 2-letter language code to an Open Graph locale string (underscore form).
const OG_LOCALE_BY_LANG: Record<string, string> = {
  kn: 'kn_IN', hi: 'hi_IN', en: 'en_IN', ta: 'ta_IN', te: 'te_IN',
  mr: 'mr_IN', bn: 'bn_IN', ml: 'ml_IN', gu: 'gu_IN', pa: 'pa_IN',
  or: 'or_IN', as: 'as_IN', ur: 'ur_IN',
};

export function bcp47Locale(lang?: string | null): string {
  if (!lang) return 'kn-IN';
  const key = lang.toLowerCase().split(/[-_]/)[0];
  return BCP47_BY_LANG[key] || 'kn-IN';
}

export function langToOgLocale(lang?: string | null): string {
  if (!lang) return 'en_IN';
  const key = lang.toLowerCase().split(/[-_]/)[0];
  return OG_LOCALE_BY_LANG[key] || 'en_IN';
}

export function buildMetadata(options: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  noindex?: boolean;
  /** Either a BCP-47-ish lang code ("kn", "hi-IN") or an OG locale ("kn_IN"). */
  locale?: string;
}): Metadata {
  const title = options.title ? `${options.title} | ${SITE_NAME}` : `${SITE_NAME} - Write. Read. Connect.`;
  const description = options.description || DEFAULT_DESCRIPTION;
  const image = options.image || DEFAULT_IMAGE;
  const url = options.url ? `${SITE_URL}${options.url}` : SITE_URL;
  const ogLocale = options.locale
    ? (options.locale.includes('_') ? options.locale : langToOgLocale(options.locale))
    : 'en_IN';

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: options.type || 'website',
      images: [{ url: image, width: 1200, height: 630, alt: options.title || SITE_NAME }],
      locale: ogLocale,
      ...(options.type === 'article' && {
        publishedTime: options.publishedTime,
        modifiedTime: options.modifiedTime,
        authors: options.author ? [options.author] : undefined,
        tags: options.tags,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: options.author ? `@${options.author}` : undefined,
    },
    robots: options.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1, 'max-video-preview': -1 },
    other: {
      'google-site-verification': process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
    },
  };
}

// JSON-LD Structured Data Builders

export function articleJsonLd(content: any, author: any) {
  return {
    '@context': 'https://schema.org',
    '@type': content.contentType === 'POEM' ? 'CreativeWork' : 'Article',
    headline: content.title,
    description: content.excerpt || (content.body ? stripHtml(content.body).slice(0, 160) : ''),
    image: content.coverImage || DEFAULT_IMAGE,
    datePublished: content.createdAt,
    dateModified: content.updatedAt || content.createdAt,
    wordCount: content.body?.split(/\s+/).length || 0,
    inLanguage: bcp47Locale(content.language),
    url: `${SITE_URL}/content/${content.id}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/content/${content.id}`,
    },
    author: {
      '@type': 'Person',
      name: author?.name || 'Unknown',
      url: author?.username ? `${SITE_URL}/user/${author.username}` : undefined,
      image: author?.profileImage || undefined,
      description: author?.bio || undefined,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    ...(content.hashtags?.length > 0 && {
      keywords: content.hashtags.map((h: any) => h.tag || h.hashtag?.tag || h).join(', '),
    }),
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: content.likesCount || content._count?.likes || 0,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: content.commentsCount || content._count?.comments || 0,
      },
    ],
  };
}

export function personJsonLd(user: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: user.name,
    alternateName: user.username ? `@${user.username}` : undefined,
    url: `${SITE_URL}/user/${user.username}`,
    image: user.profileImage || undefined,
    description: user.bio || `Writer on ${SITE_NAME}`,
    sameAs: [],
    mainEntityOfPage: {
      '@type': 'ProfilePage',
      '@id': `${SITE_URL}/user/${user.username}`,
    },
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/FollowAction',
      userInteractionCount: user.followersCount || 0,
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: 'Kalaloka - Write. Read. Connect.',
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    inLanguage: ['en', 'hi', 'kn', 'ta', 'te', 'mr', 'bn', 'gu', 'ml', 'pa', 'ur'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function collectionPageJsonLd(title: string, url: string, items: any[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    url: `${SITE_URL}${url}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.slice(0, 10).map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/content/${item.id}`,
        name: item.title,
      })),
    },
  };
}
