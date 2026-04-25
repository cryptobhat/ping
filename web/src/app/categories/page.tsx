import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import CategoriesClient from './CategoriesClient';

export const metadata: Metadata = buildMetadata({
  title: 'Browse all categories',
  description:
    'Browse every category on Kalaloka — stories, poems, and articles grouped by genre. Find romance, mystery, mythology, motivation, and more in 11+ Indian languages.',
  url: '/categories',
});

export default function CategoriesPage() {
  return <CategoriesClient />;
}
