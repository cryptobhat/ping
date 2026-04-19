'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { seriesApi } from '@/lib/api';
import { getReadingLang } from '@/lib/reading-lang';
import { BookCard } from '@/components/content/BookCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { BookCardSkeleton } from '@/components/ui/Skeleton';
import { Library } from 'lucide-react';

export default function SeriesBrowsePage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const lang = getReadingLang();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await seriesApi.list({
          limit: 40,
          page: 1,
          ...(lang ? { language: lang } : {}),
        });
        const rows = data?.data ?? data ?? [];
        setList(Array.isArray(rows) ? rows : []);
      } catch {
        setList([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [lang]);

  return (
    <div className="py-4 lg:py-8 px-4 lg:px-6 space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <Library className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50">Series</h1>
          <p className="text-sm text-warm-500">Multi-episode stories — free &amp; premium chapters</p>
        </div>
      </div>

      <SectionHeader title="All series" subtitle="Episode-wise reading in your language" />

      {loading ? (
        <div className="flex gap-4 overflow-hidden flex-wrap">
          {[...Array(8)].map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="text-sm text-warm-500 text-center py-16">No series in this language yet. Try another language from the sidebar.</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {list.map((s: any) => (
            <BookCard key={s.id} item={s} type="series" />
          ))}
        </div>
      )}

      <p className="text-xs text-warm-400 text-center pb-8">
        <Link href="/discover" className="text-primary hover:underline">Discover more</Link>
        {' · '}
        <Link href="/welcome" className="text-primary hover:underline">Change language</Link>
      </p>
    </div>
  );
}
