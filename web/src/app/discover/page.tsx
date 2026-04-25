import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import DiscoverClient from './DiscoverClient';

const TYPE_LABELS: Record<string, string> = {
  STORY: 'stories',
  POEM: 'poems',
  ARTICLE: 'articles',
};

/**
 * Discover is dynamic — searchParams (`type`, `category`, `tab`) influence
 * the displayed content set, so we generate per-request metadata. We keep
 * the title bounded (no unbounded category names from arbitrary input;
 * we only echo back the small whitelisted `type` values for safety).
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  const rawType = Array.isArray(searchParams?.type) ? searchParams?.type[0] : searchParams?.type;
  const typeKey = (rawType || '').toString().toUpperCase();
  const typeLabel = TYPE_LABELS[typeKey];
  const tab = (Array.isArray(searchParams?.tab) ? searchParams?.tab[0] : searchParams?.tab) || '';

  let title = 'Discover stories, poems, and articles';
  let description =
    'Discover trending stories, poems, and articles from Kannada writers across India. Find new genres, follow rising authors, and explore curated reading lists every day on Kalaloka.';

  if (tab === 'series') {
    title = 'Browse series';
    description =
      'Browse multi-chapter series on Kalaloka — long-form stories you can binge-read in your language. Free and premium chapters, updated daily.';
  } else if (typeLabel) {
    title = `Discover ${typeLabel}`;
    description = `Explore trending ${typeLabel} from Kalaloka writers in 11+ Indian languages. Filter by category, sort by popularity or rating, and find your next favourite read.`;
  }

  return buildMetadata({
    title,
    description,
    url: '/discover',
  });
}

export default function DiscoverPage() {
  return <DiscoverClient />;
}
