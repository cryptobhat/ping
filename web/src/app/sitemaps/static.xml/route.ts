/**
 * Static + low-volume routes. Anything that is not paginated content,
 * a user profile, a category, a hashtag, or a competition lives here.
 * Adding a new top-level page? Add it to STATIC_PAGES below — do NOT
 * scatter site-wide URLs across multiple sitemap chunks.
 */
import { urlsetResponse, type SitemapEntry } from '@/lib/sitemap-xml';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalaloka.buzz';

export const revalidate = 3600;

const STATIC_PAGES: SitemapEntry[] = [
  { url: SITE_URL, changeFrequency: 'daily', priority: 1.0 },
  { url: `${SITE_URL}/discover`, changeFrequency: 'daily', priority: 0.9 },
  { url: `${SITE_URL}/categories`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${SITE_URL}/series`, changeFrequency: 'weekly', priority: 0.6 },
  { url: `${SITE_URL}/leaderboard`, changeFrequency: 'daily', priority: 0.6 },
  { url: `${SITE_URL}/competitions`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${SITE_URL}/create`, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${SITE_URL}/login`, changeFrequency: 'monthly', priority: 0.5 },
  { url: `${SITE_URL}/subscription`, changeFrequency: 'monthly', priority: 0.6 },
  { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.4 },
  { url: `${SITE_URL}/help`, changeFrequency: 'monthly', priority: 0.4 },
  // Legal / policy pages
  { url: `${SITE_URL}/privacy-policy`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/terms`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/community-guidelines`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/copyright`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/refund-policy`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/cookie-policy`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/creator-agreement`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/content-licensing`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/data-protection`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/acceptable-use`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/grievance-redressal`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/accessibility`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/anti-plagiarism`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/payment-terms`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/advertising-policy`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/safety-trust`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/contest-rules`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/api-terms`, changeFrequency: 'monthly', priority: 0.3 },
];

export async function GET() {
  const now = new Date();
  return urlsetResponse(STATIC_PAGES.map((e) => ({ lastModified: now, ...e })));
}
