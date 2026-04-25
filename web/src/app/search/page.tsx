import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import SearchClient from './SearchClient';

/**
 * Search results pages are deliberately noindexed: most queries produce
 * thin, duplicative pages that dilute crawl budget. If we ever build
 * curated SEO landing pages for high-value queries (e.g. "kannada love
 * stories"), wire those through dedicated routes — not /search?q=.
 */
export const metadata: Metadata = buildMetadata({
  title: 'Search Kalaloka',
  description:
    'Search Kalaloka for stories, poems, articles, and writers in Kannada, Hindi, English, and more.',
  url: '/search',
  noindex: true,
});

export default function SearchPage() {
  return <SearchClient />;
}
