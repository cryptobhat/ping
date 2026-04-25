'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { contentApi, hashtagApi, ratingApi } from '@/lib/api';
import { getReadingLang } from '@/lib/reading-lang';
import { formatNumber } from '@/lib/utils';
import {
  Search as SearchIcon, X, TrendingUp, Hash, Clock, BookOpen,
  Users, Feather, FileText, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { FallbackImage } from '@/components/ui/FallbackImage';
import { PageContainer } from '@/components/ui/PageContainer';
import { Chip } from '@/components/ui/Chip';
import { useMediaQuery } from '@/lib/use-media-query';

const RECENT_SEARCHES_KEY = 'kalaloka_recent_searches';
const MAX_RECENT = 8;

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === 'undefined') return;
  const trimmed = query.trim();
  if (!trimmed) return;
  const prev = getRecentSearches().filter((s) => s !== trimmed);
  const next = [trimmed, ...prev].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

const typeConfig: Record<string, { label: string; variant: 'story' | 'poem' | 'article'; icon: any }> = {
  STORY: { label: 'Story', variant: 'story', icon: BookOpen },
  POEM: { label: 'Poem', variant: 'poem', icon: Feather },
  ARTICLE: { label: 'Article', variant: 'article', icon: FileText },
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Only autoFocus on desktop — on mobile this forces the keyboard up which
  // pushes content and feels jarring as a navigation arrival experience.
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Real data states
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<any[]>([]);
  const [trendingWriters, setTrendingWriters] = useState<any[]>([]);
  const [hashtagsLoading, setHashtagsLoading] = useState(true);
  const [writersLoading, setWritersLoading] = useState(true);

  const showResults = query.trim().length >= 2;

  // Load recent searches from localStorage on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Load trending hashtags and top writers from API
  useEffect(() => {
    (async () => {
      setHashtagsLoading(true);
      try {
        const { data } = await hashtagApi.getTrending();
        const list = data?.data ?? data ?? [];
        setTrendingHashtags(Array.isArray(list) ? list : []);
      } catch {
        setTrendingHashtags([]);
      } finally {
        setHashtagsLoading(false);
      }
    })();

    (async () => {
      setWritersLoading(true);
      try {
        const { data } = await ratingApi.getTopAuthors();
        const list = data?.data ?? data ?? [];
        setTrendingWriters(Array.isArray(list) ? list.slice(0, 8) : []);
      } catch {
        setTrendingWriters([]);
      } finally {
        setWritersLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const lang = getReadingLang();
        const { data } = await contentApi.getFeed({
          search: q,
          limit: 24,
          ...(lang ? { language: lang } : {}),
        });
        const list = data?.data ?? data ?? [];
        setResults(Array.isArray(list) ? list : []);
        // Save to recent searches on successful search
        saveRecentSearch(q);
        setRecentSearches(getRecentSearches());
      } catch {
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 320);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const clearRecentSearches = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    }
  };

  return (
    <PageContainer size="md">
      {/* Search Input */}
      <div className="flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-warm-900 border-2 border-warm-200 dark:border-warm-700 rounded-2xl focus-within:border-primary transition-colors mb-8">
        <SearchIcon className="w-5 h-5 text-warm-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stories, poems, articles, writers..."
          className="flex-1 bg-transparent text-warm-900 dark:text-warm-100 outline-none placeholder:text-warm-400"
          autoFocus={isDesktop}
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className="p-1 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-lg">
            <X className="w-4 h-4 text-warm-400" />
          </button>
        )}
      </div>

      {showResults ? (
        <div>
          {searchLoading ? (
            <p className="text-sm text-warm-500">Searching...</p>
          ) : results.length === 0 ? (
            <EmptyState
              icon={SearchIcon}
              title="No matches"
              description="Try different keywords or browse trending topics below."
            />
          ) : (
            <>
              <p className="text-sm text-warm-500 mb-4">{results.length} results for &quot;{query.trim()}&quot;</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((item) => {
                  const config = typeConfig[item.contentType] || typeConfig.STORY;
                  const author = item.author || {};
                  const excerpt = item.description || item.excerpt || '';
                  const views = item.viewCount ?? item.viewsCount ?? 0;
                  return (
                    <Link key={item.id} href={`/content/${item.id}`}>
                      <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 overflow-hidden hover:border-primary/20 hover:shadow-md transition-all group">
                        <div className="relative aspect-[2/1] overflow-hidden bg-warm-100 dark:bg-warm-800">
                          {item.coverImage ? (
                            <FallbackImage
                              src={item.coverImage}
                              alt={(item.title || '').slice(0, 100)}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              fallbackClassName="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                              fallbackIcon={BookOpen}
                              fallbackIconClassName="w-10 h-10 text-warm-300 dark:text-warm-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-warm-400">
                              <BookOpen className="w-10 h-10" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <Badge variant={config.variant} size="md">{config.label}</Badge>
                          </div>
                          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-warm-900 dark:text-warm-100 mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-xs text-warm-500 line-clamp-2 mb-3">{excerpt || 'Open to read'}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar src={author.profileImage} name={author.name || 'Writer'} size="xs" />
                              <span className="text-xs font-medium text-warm-700 dark:text-warm-300 truncate">{author.name || author.username || 'Writer'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-warm-400 flex-shrink-0">
                              <BookOpen className="w-3 h-3" />
                              {formatNumber(views)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ) : (
        /* Default: Trending + Recent */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left column: Recent searches + Trending hashtags */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-warm-400" />
                    <h2 className="text-sm font-semibold text-warm-700 dark:text-warm-300">Recent Searches</h2>
                  </div>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-warm-400 hover:text-primary transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((s) => (
                    <Chip key={s} size="md" variant="secondary" onClick={() => setQuery(s)}>
                      {s}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Hashtags */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-warm-700 dark:text-warm-300">Trending Topics</h2>
              </div>
              {hashtagsLoading ? (
                <div className="flex items-center gap-2 text-sm text-warm-400 py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading trending topics...
                </div>
              ) : trendingHashtags.length === 0 ? (
                <p className="text-sm text-warm-400 py-4">No trending topics right now.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {trendingHashtags.map((h: any, i: number) => (
                    <button
                      key={h.id || h.tag || i}
                      onClick={() => setQuery(h.tag || h.name || '')}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-warm-900 border border-warm-100 dark:border-warm-800 rounded-xl hover:border-primary/20 transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-warm-900 dark:text-warm-100 flex items-center gap-1">
                          <Hash className="w-3.5 h-3.5 text-primary" />
                          {h.tag || h.name}
                        </p>
                        {h.count != null && (
                          <p className="text-[11px] text-warm-400">{formatNumber(h.count)} posts</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column: Trending Writers */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-warm-700 dark:text-warm-300">Popular Writers</h2>
            </div>
            {writersLoading ? (
              <div className="flex items-center gap-2 text-sm text-warm-400 py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading writers...
              </div>
            ) : trendingWriters.length === 0 ? (
              <p className="text-sm text-warm-400 py-4">No top writers found yet.</p>
            ) : (
              <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 divide-y divide-warm-100 dark:divide-warm-800 overflow-hidden">
                {trendingWriters.map((w: any) => (
                  <Link key={w.id || w.username} href={`/user/${w.username || w.id}`}>
                    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-warm-50 dark:hover:bg-warm-800/50 transition-colors">
                      <Avatar src={w.profileImage} name={w.name || w.username || 'Writer'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-warm-900 dark:text-warm-100 truncate">{w.name || w.username}</p>
                        {w.username && <p className="text-[11px] text-warm-400">@{w.username}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {w.followersCount != null && (
                          <p className="text-xs font-semibold text-warm-700 dark:text-warm-300">{formatNumber(w.followersCount)}</p>
                        )}
                        {w.averageRating != null && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400">{Number(w.averageRating).toFixed(1)} rating</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
