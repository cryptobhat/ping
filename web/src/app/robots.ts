import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalaloka.buzz';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/settings/', '/wallet/', '/chat/', '/notifications/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/settings/', '/wallet/', '/chat/'],
      },
    ],
    // Single canonical sitemap URL — the parent `/sitemap.xml` is a
    // sitemap-index file that fans out to chunked child sitemaps under
    // `/sitemaps/...` (see `src/app/sitemap.xml/route.ts`).
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
