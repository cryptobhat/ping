/**
 * Competition detail pages. Most contests are short-lived but each one
 * is a useful SEO landing page while open, so we list both active and
 * historical competitions. Volume is small (low double-digits) so we
 * never paginate.
 */
import { urlsetResponse, type SitemapEntry } from '@/lib/sitemap-xml';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalaloka.buzz';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kalaloka.buzz';

export const revalidate = 3600;

export async function GET() {
  let entries: SitemapEntry[] = [];
  try {
    const res = await fetch(`${API_URL}/api/v1/competitions`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      const list: any[] = json?.data || json || [];
      entries = list
        .filter((c) => c?.id)
        .map((c) => ({
          url: `${SITE_URL}/competitions/${c.id}`,
          lastModified: new Date(c.updatedAt || c.endsAt || c.createdAt || Date.now()),
          changeFrequency: 'weekly',
          priority: 0.5,
        }));
    }
  } catch {
    /* swallow — empty sitemap is preferred over 500 */
  }
  return urlsetResponse(entries);
}
