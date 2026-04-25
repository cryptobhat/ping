/**
 * Tiny helper for emitting <urlset> sitemap XML from chunked route
 * handlers. Centralised so every child sitemap renders the same shape and
 * keeps consistent caching headers. We intentionally do NOT use the
 * `MetadataRoute.Sitemap` convention here because we need full control
 * over the output URL paths (`/sitemaps/content/0.xml` etc.) which the
 * convention does not support.
 */
import { NextResponse } from 'next/server';

export type SitemapEntry = {
  url: string;
  lastModified?: Date | string;
  changeFrequency?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  priority?: number;
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function urlsetResponse(entries: SitemapEntry[]): NextResponse {
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map((e) => {
        const last =
          e.lastModified instanceof Date
            ? e.lastModified.toISOString()
            : (e.lastModified ?? new Date().toISOString());
        const parts = [`    <loc>${escapeXml(e.url)}</loc>`, `    <lastmod>${last}</lastmod>`];
        if (e.changeFrequency) parts.push(`    <changefreq>${e.changeFrequency}</changefreq>`);
        if (typeof e.priority === 'number') parts.push(`    <priority>${e.priority}</priority>`);
        return `  <url>\n${parts.join('\n')}\n  </url>`;
      })
      .join('\n') +
    `\n</urlset>\n`;
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
