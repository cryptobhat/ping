'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ContentCard } from '@/components/content/ContentCard';
import { ContentCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Heart, Loader2, LogIn, Search, BookOpen, Layers,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { favoriteApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const ITEMS_PER_PAGE = 18;

type ContentType = 'all' | 'STORY' | 'POEM' | 'ARTICLE';

const filters: { key: ContentType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'STORY', label: 'Stories' },
  { key: 'POEM', label: 'Poems' },
  { key: 'ARTICLE', label: 'Articles' },
];

export default function FavoritesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<ContentType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await favoriteApi.getAll({ page, limit: ITEMS_PER_PAGE });
      const data = res.data?.data ?? res.data ?? [];
      const items = Array.isArray(data) ? data : [];
      setFavorites(items);
      setTotal(res.data?.pagination?.total ?? res.data?.total ?? items.length);
    } catch {
      setFavorites([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, page]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const handleRemoveFavorite = async (contentId: string) => {
    try {
      await favoriteApi.remove(contentId);
      setFavorites((prev) => prev.filter((f) => {
        const cId = f.content?.id ?? f.contentId ?? f.id;
        return cId !== contentId;
      }));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  // Client-side filtering
  const filtered = favorites.filter((fav) => {
    const content = fav.content || fav;
    const type = content.contentType || '';
    const title = (content.title || '').toLowerCase();
    const matchesType = filter === 'all' || type === filter;
    const matchesSearch = !searchQuery || title.includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="px-4 lg:px-8 py-16 text-center space-y-4 max-w-md mx-auto">
        <Heart className="w-12 h-12 text-warm-300 mx-auto" />
        <h1 className="text-xl font-bold text-warm-900 dark:text-warm-50">Sign in to view favorites</h1>
        <p className="text-sm text-warm-500">Save your favorite stories, poems, and articles.</p>
        <Link href="/login?next=/favorites">
          <Button icon={<LogIn className="w-4 h-4" />}>Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8 space-y-6 pb-28 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center">
            <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-warm-900 dark:text-warm-50">
              Favorites
            </h1>
            <p className="text-sm text-warm-500 mt-0.5">
              {total > 0 ? `${total} item${total !== 1 ? 's' : ''} saved` : 'Your favorited content'}
            </p>
          </div>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search favorites..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 text-warm-900 dark:text-warm-100 placeholder:text-warm-400"
          />
        </div>

        {/* Type filter pills */}
        <div className="flex gap-1 p-1 bg-warm-100 dark:bg-warm-800 rounded-xl self-start">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                'px-3 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap',
                filter === key
                  ? 'bg-white dark:bg-warm-700 text-warm-900 dark:text-warm-100 shadow-sm'
                  : 'text-warm-500 hover:text-warm-700 dark:hover:text-warm-300'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <ContentCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        favorites.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No favorites yet"
            description="Tap the heart on any story to save it here."
            actionLabel="Discover Content"
            onAction={() => window.location.href = '/discover'}
          />
        ) : (
          <EmptyState
            icon={Search}
            title="No matches"
            description={`No favorites match "${searchQuery || filter}". Try a different filter.`}
          />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((fav: any) => {
              const content = fav.content || fav;
              return (
                <div key={fav.id} className="relative group">
                  <ContentCard content={content} variant="grid" />
                  {/* Remove favorite button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveFavorite(content.id)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-warm-900/90 border border-warm-200 dark:border-warm-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-800"
                    title="Remove from favorites"
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={cn(
                  'p-2 rounded-lg border transition-colors',
                  page <= 1
                    ? 'border-warm-200 dark:border-warm-800 text-warm-300 dark:text-warm-600 cursor-not-allowed'
                    : 'border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-400 hover:bg-warm-50 dark:hover:bg-warm-800'
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-warm-500">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={cn(
                  'p-2 rounded-lg border transition-colors',
                  page >= totalPages
                    ? 'border-warm-200 dark:border-warm-800 text-warm-300 dark:text-warm-600 cursor-not-allowed'
                    : 'border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-400 hover:bg-warm-50 dark:hover:bg-warm-800'
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
