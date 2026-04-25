/**
 * Chunked user-profile sitemap. We don't (yet) have a paginated public
 * users endpoint, so we derive the username set from the published
 * content listing — same approach the legacy single-file sitemap took.
 * Each chunk corresponds to one page of the content listing, deduped
 * by username. A future improvement is to wire in a real
 * `/api/v1/users?status=public&page=N` endpoint.
 */
import { urlsetResponse, type SitemapEntry } from '@/lib/sitemap-xml';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalaloka.buzz';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kalaloka.buzz';
const CHUNK_SIZE = 5000;

export const revalidate = 3600;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const idx = Math.max(0, parseInt(params.id, 10) || 0);
  const page = idx + 1;
  let entries: SitemapEntry[] = [];
  try {
    const res = await fetch(
      `${API_URL}/api/v1/content?status=PUBLISHED&page=${page}&limit=${CHUNK_SIZE}`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const json = await res.json();
      const items: any[] = json?.data || json || [];
      const usernames = new Set<string>();
      for (const it of items) {
        const u = it?.author?.username;
        if (u) usernames.add(u);
      }
      const now = new Date();
      entries = Array.from(usernames).map((username) => ({
        url: `${SITE_URL}/user/${username}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }
  } catch {
    /* swallow — empty sitemap */
  }
  return urlsetResponse(entries);
}
