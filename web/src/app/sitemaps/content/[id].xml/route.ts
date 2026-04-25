/**
 * Chunked content sitemap. The parent `/sitemap.xml` index handler
 * decides how many chunks exist; each chunk holds up to CHUNK_SIZE URLs
 * (5000 — comfortably below Google's 50k cap, leaves headroom for
 * lastmod dates and any future <image> entries).
 *
 * The list endpoint must support `page` + `limit` + `status=PUBLISHED`.
 * If the upstream returns fewer items than requested we ship a smaller
 * sitemap, which is valid.
 */
import { urlsetResponse, type SitemapEntry } from '@/lib/sitemap-xml';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalaloka.buzz';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kalaloka.buzz';
const CHUNK_SIZE = 5000;

export const revalidate = 3600;
// Opt out of static prerender — chunk param is unbounded.
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const idx = Math.max(0, parseInt(params.id, 10) || 0);
  const page = idx + 1; // upstream API is 1-indexed
  let entries: SitemapEntry[] = [];
  try {
    const res = await fetch(
      `${API_URL}/api/v1/content?status=PUBLISHED&page=${page}&limit=${CHUNK_SIZE}`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const json = await res.json();
      const items: any[] = json?.data || json || [];
      entries = items
        .filter((it) => it?.id)
        .map((it) => ({
          url: `${SITE_URL}/content/${it.id}`,
          lastModified: new Date(it.updatedAt || it.createdAt || Date.now()),
          changeFrequency: 'weekly',
          priority: 0.8,
        }));
    }
  } catch {
    /* swallow — empty sitemap */
  }
  return urlsetResponse(entries);
}
