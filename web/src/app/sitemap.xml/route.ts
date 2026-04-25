/**
 * Sitemap index — lists every child sitemap. We use a custom route handler
 * (rather than Next's sitemap.ts convention) because we need to fan out to
 * multiple chunked sitemap files for a catalog that exceeds Google's 50k
 * URL / 50MB-per-sitemap limits. The default `MetadataRoute.Sitemap`
 * convention can only emit a single `<urlset>`, never a `<sitemapindex>`,
 * and `generateSitemaps` does not produce a parent index automatically.
 *
 * Children:
 *   - /sitemaps/static.xml          static + low-volume dynamic routes
 *   - /sitemaps/categories.xml      every category landing page
 *   - /sitemaps/competitions.xml    competition detail pages
 *   - /sitemaps/hashtags.xml        top trending hashtags
 *   - /sitemaps/users/{0..N}.xml    user profile pages, 5000 per chunk
 *   - /sitemaps/content/{0..N}.xml  published content, 5000 per chunk
 */

import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalaloka.buzz';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kalaloka.buzz';
const CHUNK_SIZE = 5000;

export const revalidate = 3600;

async function fetchTotal(path: string): Promise<number> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return 0;
    const json = await res.json();
    return (
      json?.meta?.total ??
      json?.pagination?.total ??
      json?.total ??
      json?.count ??
      (Array.isArray(json?.data) ? json.data.length : 0)
    ) || 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  // We rely on the public content list endpoint to surface a total count.
  // If the API doesn't return one we fall back to a single chunk per
  // category — empty chunks render as a valid (small) sitemap.
  const contentTotal = await fetchTotal(
    '/api/v1/content?status=PUBLISHED&limit=1&page=1'
  );
  // No public users count endpoint yet; cap users at the same denominator
  // as content. Fix once `/api/v1/users/count` is exposed.
  const userTotal = contentTotal;

  const contentChunks = Math.max(1, Math.ceil(contentTotal / CHUNK_SIZE));
  const userChunks = Math.max(1, Math.ceil(userTotal / CHUNK_SIZE));

  const lastmod = new Date().toISOString();
  const children: string[] = [
    `${SITE_URL}/sitemaps/static.xml`,
    `${SITE_URL}/sitemaps/categories.xml`,
    `${SITE_URL}/sitemaps/competitions.xml`,
    `${SITE_URL}/sitemaps/hashtags.xml`,
  ];
  for (let i = 0; i < contentChunks; i++) {
    children.push(`${SITE_URL}/sitemaps/content/${i}.xml`);
  }
  for (let i = 0; i < userChunks; i++) {
    children.push(`${SITE_URL}/sitemaps/users/${i}.xml`);
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    children
      .map(
        (loc) =>
          `  <sitemap>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`
      )
      .join('\n') +
    `\n</sitemapindex>\n`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
