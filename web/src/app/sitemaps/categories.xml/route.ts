/**
 * Every category landing page. Categories are a small fixed set so we
 * keep them in a single child sitemap (no pagination). If we ever cross
 * 5000 categories, switch to a chunked layout matching content.xml.
 */
import { urlsetResponse, type SitemapEntry } from '@/lib/sitemap-xml';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalaloka.buzz';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kalaloka.buzz';

export const revalidate = 3600;

export async function GET() {
  const now = new Date();
  let entries: SitemapEntry[] = [];
  try {
    const res = await fetch(`${API_URL}/api/v1/categories`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      const list: any[] = json?.data || json || [];
      entries = list
        .filter((c) => c?.isActive !== false && (c?.slug || c?.id))
        .map((c) => ({
          url: `${SITE_URL}/category/${c.slug || c.id}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.7,
        }));
    }
  } catch {
    /* upstream down — ship an empty sitemap rather than 500. */
  }
  return urlsetResponse(entries);
}
