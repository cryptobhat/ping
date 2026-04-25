/**
 * Top trending hashtags. The /hashtag/[tag] route is essentially a
 * tag-search results page — useful enough to index for popular tags
 * but not for the long tail (would dilute crawl budget). We include
 * only what `hashtagApi.getTrending()` returns.
 */
import { urlsetResponse, type SitemapEntry } from '@/lib/sitemap-xml';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalaloka.buzz';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kalaloka.buzz';

export const revalidate = 3600;

export async function GET() {
  const now = new Date();
  let entries: SitemapEntry[] = [];
  try {
    const res = await fetch(`${API_URL}/api/v1/hashtags/trending`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      const list: any[] = json?.data || json || [];
      entries = list
        .map((h) => h?.tag || h?.name)
        .filter(Boolean)
        .map((tag: string) => ({
          url: `${SITE_URL}/hashtag/${encodeURIComponent(tag)}`,
          lastModified: now,
          changeFrequency: 'daily',
          priority: 0.4,
        }));
    }
  } catch {
    /* upstream down — empty sitemap */
  }
  return urlsetResponse(entries);
}
