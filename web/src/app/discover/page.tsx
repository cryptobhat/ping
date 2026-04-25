'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { contentApi, categoryApi, hashtagApi, seriesApi, leaderboardApi } from '@/lib/api';
import { ContentCard } from '@/components/content/ContentCard';
import { BookCard } from '@/components/content/BookCard';
import { WriterCard } from '@/components/content/WriterCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Badge } from '@/components/ui/Badge';
import { HScroll } from '@/components/ui/Carousel';
import { Avatar } from '@/components/ui/Avatar';
import { ContentCardSkeleton, BookCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import { Heading } from '@/components/ui/Heading';
import { Tabs } from '@/components/ui/Tabs';
import { Chip } from '@/components/ui/Chip';
import {
  Search, Hash, Compass, TrendingUp, Filter, Flame, Star, Eye, Heart,
  BookOpen, Feather, FileText, ArrowRight, ChevronRight, Clock, ThumbsUp, Tag,
  Trophy, Crown, Medal, X, SlidersHorizontal,
} from 'lucide-react';
import { cn, formatNumber, formatDate, readingTime } from '@/lib/utils';
import Link from 'next/link';
import { getReadingLang } from '@/lib/reading-lang';
import { stripHtml } from '@/lib/html-utils';
import { FallbackImage } from '@/components/ui/FallbackImage';

const contentTypes = [
  { value: '', label: 'All', icon: Compass },
  { value: 'STORY', label: 'Stories', icon: BookOpen },
  { value: 'POEM', label: 'Poems', icon: Feather },
  { value: 'ARTICLE', label: 'Articles', icon: FileText },
];

export default function DiscoverPage() {
  return <Suspense><DiscoverContent /></Suspense>;
}

function DiscoverContent() {
  const searchParams = useSearchParams();
  const tabSeries = searchParams.get('tab') === 'series';
  const [activeType, setActiveType] = useState(searchParams.get('type') || '');
  const [activeSort, setActiveSort] = useState<'latest' | 'popular' | 'top_rated'>('latest');
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [content, setContent] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [hashtags, setHashtags] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [seriesBrowse, setSeriesBrowse] = useState<any[]>([]);
  const [weeklyStars, setWeeklyStars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const lang = getReadingLang();

  // Number of non-default filters currently applied (mobile chip badge)
  const activeFilterCount =
    (activeSort !== 'latest' ? 1 : 0) +
    (activeCategoryId ? 1 : 0) +
    (activeType ? 1 : 0);

  // Lock body scroll while sheet is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (filterSheetOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFilterSheetOpen(false); };
      document.addEventListener('keydown', onKey);
      return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
    }
  }, [filterSheetOpen]);

  useEffect(() => {
    loadInitialData();
  }, [lang]);

  useEffect(() => {
    if (tabSeries) {
      (async () => {
        setLoading(true);
        try {
          const params: any = { page: 1, limit: 36 };
          if (lang) params.language = lang;
          const { data } = await seriesApi.list(params);
          setSeriesBrowse(Array.isArray(data?.data) ? data.data : []);
        } catch {
          setSeriesBrowse([]);
        } finally {
          setLoading(false);
        }
      })();
      return;
    }
    setPage(1);
    setContent([]);
    loadContent(1);
  }, [activeType, activeSort, activeCategoryId, tabSeries, lang]);

  const loadInitialData = async () => {
    try {
      const [catRes, hashRes, seriesRes, weeklyRes] = await Promise.allSettled([
        categoryApi.getAll(),
        hashtagApi.getTrending(),
        seriesApi.getPopular({ limit: 10, ...(lang ? { language: lang } : {}) }),
        leaderboardApi.getWeeklyStars({ limit: 3, ...(lang ? { language: lang } : {}) }),
      ]);
      if (catRes.status === 'fulfilled') setCategories(catRes.value.data?.data || catRes.value.data || []);
      if (hashRes.status === 'fulfilled') setHashtags(hashRes.value.data?.data || hashRes.value.data || []);
      if (seriesRes.status === 'fulfilled') setSeries(seriesRes.value.data?.data || seriesRes.value.data || []);
      if (weeklyRes.status === 'fulfilled') setWeeklyStars(weeklyRes.value.data?.data || []);
    } catch {
      setCategories([]);
      setHashtags([]);
      setSeries([]);
    }
  };

  const loadContent = async (p: number) => {
    if (tabSeries) return;
    setLoading(p === 1);
    try {
      const params: any = { page: p, limit: 15 };
      if (activeType) params.contentType = activeType;
      if (activeSort && activeSort !== 'latest') params.sort = activeSort;
      if (activeCategoryId) params.categoryId = activeCategoryId;
      if (lang) params.language = lang;
      const { data } = await contentApi.getFeed(params);
      const items = data?.data || data || [];
      if (p === 1) setContent(items);
      else setContent((prev) => [...prev, ...items]);
      setHasMore(items.length >= 15);
    } catch {
      if (p === 1) setContent([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    loadContent(next);
  };

  const allCategories = categories;
  const allHashtags = hashtags;
  const allSeries = series;

  const writers = content
    .filter((c) => c.author?.name)
    .reduce((acc: any[], c) => {
      if (!acc.find((w: any) => w.id === c.author.id)) acc.push(c.author);
      return acc;
    }, [])
    .slice(0, 12);

  if (tabSeries) {
    const display = seriesBrowse;
    if (loading) {
      return (
        <div className="py-4 lg:py-6 px-4 lg:px-8 space-y-6">
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="flex flex-wrap gap-4">
            {[...Array(8)].map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        </div>
      );
    }
    return (
      <PageContainer className="space-y-8 pb-28 lg:pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/discover" className="text-sm text-primary font-medium hover:underline mb-2 inline-block">
              ← Back to Discover
            </Link>
            <Heading level={2} as="h1">Browse series</Heading>
            <p className="text-sm text-warm-500 mt-1">Episodic stories — free and paid chapters</p>
          </div>
          <Link
            href="/series"
            className="text-sm font-medium text-primary border border-primary/30 rounded-xl px-4 py-2 hover:bg-primary/5"
          >
            Full series list
          </Link>
        </div>
        <div className="flex flex-wrap gap-4">
          {display.map((s: any) => (
            <BookCard key={s.id} item={s} type="series" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (loading && content.length === 0) {
    return (
      <div className="py-4 lg:py-6 space-y-8">
        {/* Search skeleton */}
        <div className="px-4 lg:px-8">
          <div className="skeleton h-12 rounded-2xl max-w-2xl mx-auto" />
        </div>
        {/* Categories skeleton */}
        <div className="px-4 lg:px-8">
          <div className="skeleton h-6 w-40 rounded mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton aspect-[3/2] rounded-xl" />)}
          </div>
        </div>
        {/* Series skeleton */}
        <div className="px-4 lg:px-8">
          <div className="skeleton h-6 w-40 rounded mb-4" />
          <div className="flex gap-4 overflow-hidden">{[...Array(6)].map((_, i) => <BookCardSkeleton key={i} />)}</div>
        </div>
        {/* Content skeleton */}
        <div className="px-4 lg:px-8">
          <div className="skeleton h-6 w-40 rounded mb-4" />
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => <ContentCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 lg:py-6 space-y-8 lg:space-y-10 pb-28 lg:pb-6">

      {/* ═══ HEADER + SEARCH ═══ */}
      <div className="px-4 lg:px-8">
        <div className="max-w-2xl mx-auto text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Compass className="w-6 h-6 text-primary" />
            <Heading level={2} as="h1">Discover</Heading>
          </div>
          <p className="text-sm text-warm-500">Explore stories, poems, and articles from amazing Kannada writers</p>
        </div>

        <Link
          href="/search"
          className="flex items-center gap-3 px-5 py-3.5 bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-2xl hover:border-primary/40 hover:shadow-md dark:hover:border-warm-700 transition-all group max-w-2xl mx-auto"
        >
          <Search className="w-5 h-5 text-warm-400 group-hover:text-primary transition-colors" />
          <span className="text-sm text-warm-400">Search stories, writers, hashtags...</span>
          <kbd className="hidden lg:inline-flex ml-auto text-[10px] text-warm-300 border border-warm-200 dark:border-warm-700 rounded px-1.5 py-0.5 font-mono">/</kbd>
        </Link>
      </div>

      {/* ═══ CATEGORY GRID (Pratilipi-style) ═══ */}
      {allCategories.length > 0 && (() => {
        const gradients = [
          'from-rose-500 to-pink-600',
          'from-violet-500 to-purple-600',
          'from-blue-500 to-indigo-600',
          'from-emerald-500 to-teal-600',
          'from-amber-500 to-orange-600',
          'from-cyan-500 to-blue-600',
          'from-fuchsia-500 to-pink-600',
          'from-lime-500 to-green-600',
          'from-red-500 to-rose-600',
          'from-sky-500 to-indigo-600',
          'from-teal-500 to-cyan-600',
          'from-orange-500 to-red-600',
          'from-indigo-500 to-violet-600',
          'from-green-500 to-emerald-600',
          'from-pink-500 to-fuchsia-600',
        ];
        return (
          <div className="px-4 lg:px-8">
            <SectionHeader title="Explore Categories" subtitle="Find your favorite genre" href="/categories" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {allCategories.slice(0, 10).map((cat: any, i: number) => (
                <Link key={cat.id} href={`/category/${cat.slug || cat.id}`} className="group">
                  <div className="relative overflow-hidden rounded-xl aspect-[3/2]">
                    {cat.iconUrl || cat.image ? (
                      <>
                        <FallbackImage
                          src={cat.iconUrl || cat.image}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          fallbackClassName={cn('w-full h-full bg-gradient-to-br', gradients[i % gradients.length], 'group-hover:scale-105 transition-transform duration-500')}
                          fallbackIcon={BookOpen}
                          fallbackIconClassName="w-0 h-0"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      </>
                    ) : (
                      <div className={cn('w-full h-full bg-gradient-to-br', gradients[i % gradients.length], 'group-hover:scale-105 transition-transform duration-500')} />
                    )}
                    <div className="absolute inset-0 flex flex-col items-start justify-end p-3">
                      <span className="text-white font-bold text-sm drop-shadow-lg">{cat.name}</span>
                      {cat.description && (
                        <span className="text-white/80 text-[10px] drop-shadow">{cat.description}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ═══ TRENDING HASHTAGS (horizontal scroll) ═══ */}
      {allHashtags.length > 0 && (
        <div className="px-4 lg:px-8">
          <SectionHeader title="Trending Topics" subtitle="Popular hashtags right now" />
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
            {allHashtags.map((h: any) => (
              <Link key={h.id || h.tag} href={`/hashtag/${h.tag || h.name}`} className="flex-shrink-0">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 hover:border-primary/30 hover:bg-primary/5 transition-all">
                  <Hash className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium text-sm text-warm-700 dark:text-warm-300 whitespace-nowrap">{h.tag || h.name}</span>
                  {h.count && (
                    <span className="text-[10px] text-warm-400 bg-warm-50 dark:bg-warm-800 rounded-full px-1.5 py-0.5">{formatNumber(h.count)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ═══ POPULAR SERIES (Pratilipi-style book cards with ranks) ═══ */}
      {allSeries.length > 0 && (
        <div className="px-4 lg:px-8">
          <SectionHeader title="Popular Series" subtitle="Multi-chapter stories to binge-read" href="/discover?tab=series" />
          <HScroll>
            {allSeries.slice(0, 8).map((s: any, i: number) => (
              <BookCard key={s.id} item={s} type="series" rank={i + 1} />
            ))}
          </HScroll>
        </div>
      )}

      {/* ═══ TRENDING STORIES (featured hero + grid) ═══ */}
      {content.length > 0 && !activeType && (
        <div className="px-4 lg:px-8">
          <SectionHeader title="Trending Stories" subtitle="What everyone is reading" href="/discover?type=STORY" />
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-[10px] font-medium text-warm-400 uppercase tracking-wide">Updated daily</span>
          </div>

          {/* Featured hero card */}
          {(() => {
            const first = content[0];
            if (!first) return null;
            const author = first.author || {};
            const wordCount = first.body?.split(/\s+/).length || 0;
            return (
              <Link href={`/content/${first.id}`} className="group block mb-5">
                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-warm-900 border border-warm-100 dark:border-warm-800 hover:border-primary/20 transition-all hover:shadow-lg">
                  <div className="flex flex-col lg:flex-row">
                    {first.coverImage && (
                      <div className="lg:w-2/5 aspect-[2/1] lg:aspect-auto lg:min-h-[240px] overflow-hidden relative bg-warm-100 dark:bg-warm-800">
                        <FallbackImage
                          src={first.coverImage}
                          alt={first.title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          fallbackClassName="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                          fallbackIcon={BookOpen}
                          fallbackIconClassName="w-10 h-10 text-warm-300 dark:text-warm-500"
                        />
                        {first.rating && (
                          <div className="absolute top-3 left-3 flex items-center gap-0.5 bg-green-600/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded">
                            <Star className="w-3 h-3 fill-white" /> {first.rating}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1 p-5 lg:p-7 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="primary" size="sm"><Flame className="w-3 h-3 mr-1" /> Trending #1</Badge>
                        <span className="text-[10px] text-warm-400">{readingTime(wordCount)}</span>
                        {first.partsCount > 1 && (
                          <span className="text-[10px] text-warm-400">{first.partsCount} parts</span>
                        )}
                      </div>
                      <h3 className="text-xl lg:text-2xl font-bold text-warm-900 dark:text-warm-50 mb-2 group-hover:text-primary transition-colors">{first.title}</h3>
                      <p className="text-sm text-warm-500 line-clamp-2 mb-4 leading-relaxed">{first.excerpt || (first.body ? stripHtml(first.body).slice(0, 150) : '')}</p>
                      <div className="flex items-center gap-3">
                        <Avatar src={author.profileImage} name={author.name || 'User'} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-warm-800 dark:text-warm-200">{author.name}</p>
                          <div className="flex items-center gap-3 text-[10px] text-warm-400">
                            <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {formatNumber(first.viewsCount || 0)}</span>
                            <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" /> {formatNumber(first.likesCount || first._count?.likes || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })()}
        </div>
      )}

      {/* ═══ CONTENT TYPE FILTERS + CONTENT GRID ═══ */}
      <div className="px-4 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <Heading level={3} as="h2">Browse Content</Heading>
          <div className="flex items-center gap-1.5 text-xs text-warm-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </div>
        </div>

        {/* Mobile / tablet: single Filters trigger that opens a bottom sheet.
            Three independent overflow-x rows are exhausting on a small viewport. */}
        <div className="lg:hidden mb-6">
          <button
            type="button"
            onClick={() => setFilterSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={filterSheetOpen}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-900 hover:border-primary/40 transition-colors text-sm font-medium text-warm-700 dark:text-warm-300"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters{activeFilterCount > 0 && ` · ${activeFilterCount}`}</span>
          </button>
        </div>

        {/* Desktop: keep inline filter rows */}
        <div className="hidden lg:block">
          <Tabs
            ariaLabel="Sort content"
            activeId={activeSort}
            onChange={(id) => setActiveSort(id as typeof activeSort)}
            className="mb-4"
            tabs={[
              { id: 'latest', label: 'Latest', icon: <Clock className="w-3.5 h-3.5" /> },
              { id: 'popular', label: 'Popular', icon: <TrendingUp className="w-3.5 h-3.5" /> },
              { id: 'top_rated', label: 'Top Rated', icon: <ThumbsUp className="w-3.5 h-3.5" /> },
            ]}
          />

          {allCategories.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1 mt-4">
              <Chip
                size="md"
                active={!activeCategoryId}
                onClick={() => setActiveCategoryId('')}
                icon={<Tag className="w-3 h-3" />}
              >
                All genres
              </Chip>
              {allCategories.filter((c: any) => c.isActive !== false).map((cat: any) => (
                <Chip
                  key={cat.id}
                  size="md"
                  active={activeCategoryId === cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                >
                  {cat.name}
                </Chip>
              ))}
            </div>
          )}

          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
            {contentTypes.map(({ value, label, icon: Icon }) => (
              <Chip
                key={value}
                size="md"
                variant={activeType === value ? 'primary' : 'secondary'}
                onClick={() => setActiveType(value)}
                icon={<Icon className="w-4 h-4" />}
              >
                {label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Mobile filter bottom-sheet */}
        {filterSheetOpen && (
          <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
              onClick={() => setFilterSheetOpen(false)}
              aria-hidden="true"
            />
            <div
              className="absolute inset-x-0 bottom-0 bg-white dark:bg-warm-900 rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-warm-100 dark:border-warm-800">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-semibold text-warm-900 dark:text-warm-100">Filters</h2>
                  {activeFilterCount > 0 && (
                    <span className="text-xs text-warm-400">· {activeFilterCount} active</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setFilterSheetOpen(false)}
                  aria-label="Close filters"
                  className="p-2 -mr-2 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-800"
                >
                  <X className="w-5 h-5 text-warm-500" />
                </button>
              </div>

              <div className="overflow-y-auto px-5 py-4 space-y-6 flex-1">
                {/* Sort */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-warm-500 mb-2">Sort by</h3>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { id: 'latest', label: 'Latest', Icon: Clock },
                      { id: 'popular', label: 'Popular', Icon: TrendingUp },
                      { id: 'top_rated', label: 'Top Rated', Icon: ThumbsUp },
                    ] as const).map(({ id, label, Icon }) => (
                      <Chip
                        key={id}
                        size="md"
                        active={activeSort === id}
                        onClick={() => setActiveSort(id)}
                        icon={<Icon className="w-3.5 h-3.5" />}
                      >
                        {label}
                      </Chip>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                {allCategories.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-warm-500 mb-2">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      <Chip size="md" active={!activeCategoryId} onClick={() => setActiveCategoryId('')} icon={<Tag className="w-3 h-3" />}>
                        All genres
                      </Chip>
                      {allCategories.filter((c: any) => c.isActive !== false).map((cat: any) => (
                        <Chip
                          key={cat.id}
                          size="md"
                          active={activeCategoryId === cat.id}
                          onClick={() => setActiveCategoryId(cat.id)}
                        >
                          {cat.name}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content type */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-warm-500 mb-2">Content type</h3>
                  <div className="flex flex-wrap gap-2">
                    {contentTypes.map(({ value, label, icon: Icon }) => (
                      <Chip
                        key={value}
                        size="md"
                        variant={activeType === value ? 'primary' : 'secondary'}
                        onClick={() => setActiveType(value)}
                        icon={<Icon className="w-4 h-4" />}
                      >
                        {label}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-5 py-3 border-t border-warm-100 dark:border-warm-800">
                <button
                  type="button"
                  onClick={() => { setActiveSort('latest'); setActiveCategoryId(''); setActiveType(''); }}
                  className="flex-1 py-3 text-sm font-medium text-warm-600 dark:text-warm-400 hover:text-warm-900 dark:hover:text-warm-100 transition-colors"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setFilterSheetOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Grid -- multi-column on desktop */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => <ContentCardSkeleton key={i} />)}
          </div>
        ) : content.length === 0 ? (
          <EmptyState icon={Compass} title="No content found" description="Try a different filter or check back later" />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {content.slice(activeType ? 0 : 1).map((item: any, i: number) => (
                <ContentCard key={item.id} content={item} variant="grid" />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  className="px-8 py-3 text-sm font-semibold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-xl transition-all hover:shadow-sm"
                >
                  Load More Content
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══ FEATURED WRITERS ═══ */}
      {writers.length > 0 && (
        <div className="px-4 lg:px-8">
          <SectionHeader title="Featured Writers" subtitle="Discover talented creators" href="/writers" />
          <HScroll>
            {writers.map((w: any) => (
              <WriterCard key={w.id} writer={w} />
            ))}
          </HScroll>
        </div>
      )}

      {/* ═══ THIS WEEK'S STARS (mini leaderboard) ═══ */}
      {weeklyStars.length > 0 && (
        <div className="px-4 lg:px-8">
          <SectionHeader title="This Week's Stars" subtitle="Top performers this week" href="/leaderboard" actionLabel="Full Leaderboard" />
          <div className="bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 dark:from-amber-950/10 dark:via-warm-900 dark:to-orange-950/10 rounded-2xl border border-amber-200/40 dark:border-amber-800/20 overflow-hidden">
            {weeklyStars.map((entry: any, i: number) => {
              const { rank, user: w, stats } = entry;
              return (
                <Link key={w.id} href={`/user/${w.username}`} className="group block">
                  <div className={cn(
                    'flex items-center gap-3 px-4 py-3.5 transition-all hover:bg-amber-50/50 dark:hover:bg-amber-950/20',
                    i !== weeklyStars.length - 1 && 'border-b border-amber-100/50 dark:border-amber-900/20'
                  )}>
                    {rank === 1 ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 flex items-center justify-center shadow shadow-amber-400/30">
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                    ) : rank === 2 ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                        <Medal className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center">
                        <Medal className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <Avatar src={w.profileImage} name={w.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-semibold text-warm-800 dark:text-warm-200 truncate group-hover:text-primary transition-colors">{w.name}</p>
                        {w.isVerified && (
                          <div className="w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <Star className="w-2 h-2 text-white fill-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-warm-400">@{w.username}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-warm-500 flex-shrink-0">
                      <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {formatNumber(stats.views)}</span>
                      <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" /> {formatNumber(stats.likes)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ NEW STORIES (BookCard horizontal scroll) ═══ */}
      {!activeType && (
        <div className="px-4 lg:px-8">
          <SectionHeader title="New Stories" subtitle="Fresh narratives to explore" href="/discover?type=STORY" />
          <HScroll>
            {content.filter((c: any) => c.contentType === 'STORY').slice(0, 10).map((s: any) => (
              <BookCard key={s.id} item={s} />
            ))}
          </HScroll>
        </div>
      )}

      {/* ═══ POEMS SECTION ═══ */}
      {!activeType && (
        <div className="px-4 lg:px-8">
          <SectionHeader title="Poems" subtitle="Short reads, deep feelings" href="/discover?type=POEM" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {content.filter((c: any) => c.contentType === 'POEM').slice(0, 6).map((poem: any) => {
              const author = poem.author || {};
              return (
                <Link key={poem.id} href={`/content/${poem.id}`} className="group">
                  <div className="flex gap-4 p-4 bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 hover:border-primary/20 hover:shadow-sm transition-all">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center flex-shrink-0 text-lg">
                      <Feather className="w-5 h-5 text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-warm-900 dark:text-warm-100 group-hover:text-primary transition-colors line-clamp-1 mb-0.5">{poem.title}</h4>
                      <p className="text-xs text-warm-500 line-clamp-2 leading-relaxed mb-2">{poem.excerpt || (poem.body ? stripHtml(poem.body).slice(0, 100) : '')}</p>
                      <div className="flex items-center gap-2">
                        <Avatar src={author.profileImage} name={author.name || 'User'} size="xs" />
                        <span className="text-[10px] text-warm-500">{author.name}</span>
                        {poem.rating && (
                          <>
                            <span className="text-[10px] text-warm-300">·</span>
                            <span className="text-[10px] text-green-600 flex items-center gap-0.5 font-medium"><Star className="w-2.5 h-2.5 fill-green-600" /> {poem.rating}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ FOOTER ═══ */}
      <div className="px-4 lg:px-8 pt-4 pb-2 border-t border-warm-100 dark:border-warm-800">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-warm-400">
          <Link href="/about" className="hover:text-primary transition-colors">About</Link>
          <Link href="/help" className="hover:text-primary transition-colors">Help & FAQ</Link>
          <Link href="/subscription" className="hover:text-primary transition-colors">Premium</Link>
          <Link href="/competitions" className="hover:text-primary transition-colors">Competitions</Link>
          <a href="mailto:support@kalaloka.buzz" className="hover:text-primary transition-colors">Contact</a>
        </div>
        <p className="text-[10px] text-warm-300 dark:text-warm-700 mt-3">&copy; {new Date().getFullYear()} Kalaloka by DigiYogi. Write. Read. Connect.</p>
      </div>
    </div>
  );
}
