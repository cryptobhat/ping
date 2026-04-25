'use client';

import { useEffect, useState, useRef } from 'react';
import { trendingApi, contentApi, seriesApi, categoryApi, hashtagApi, leaderboardApi, feedApi, dailyTopicApi, liveApi, bannerApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { ContentCard } from '@/components/content/ContentCard';
import { BookCard } from '@/components/content/BookCard';
import { WriterCard } from '@/components/content/WriterCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ContentCardSkeleton, BookCardSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { HScroll, Carousel } from '@/components/ui/Carousel';
import { Avatar } from '@/components/ui/Avatar';
import {
  TrendingUp, Flame, BookOpen, Feather, FileText, Crown, PenTool,
  Hash, Star, Eye, Heart, Zap, Clock, Award, Users, Trophy, Medal,
} from 'lucide-react';
import { cn, formatNumber, formatDate, readingTime } from '@/lib/utils';
import Link from 'next/link';
import { getReadingLang } from '@/lib/reading-lang';
import { fetchSiteCopy } from '@/lib/site-copy';
import { stripHtml } from '@/lib/html-utils';
import Image from 'next/image';
import { FallbackImage } from '@/components/ui/FallbackImage';

export default function HomePage() {
  const [trending, setTrending] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [poems, setPoems] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [hashtags, setHashtags] = useState<any[]>([]);
  const [topWriters, setTopWriters] = useState<any[]>([]);
  const [risingAuthors, setRisingAuthors] = useState<any[]>([]);
  const [forYou, setForYou] = useState<any[]>([]);
  const [dailyTopic, setDailyTopic] = useState<{ topic: string; topicKn: string; description: string; date: string } | null>(null);
  const [liveRooms, setLiveRooms] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [copy, setCopy] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadData();
    }
  }, []);

  const loadData = async () => {
    const lang = getReadingLang();
    if (!lang) {
      setLoading(false);
      return;
    }
    try {
      const [trendRes, storyRes, poemRes, articleRes, seriesRes, catRes, hashRes, copyRes, lbRes] = await Promise.allSettled([
        trendingApi.get({ window: 'daily', language: lang }),
        contentApi.getFeed({ limit: 12, contentType: 'STORY', language: lang }),
        contentApi.getFeed({ limit: 10, contentType: 'POEM', language: lang }),
        contentApi.getFeed({ limit: 10, contentType: 'ARTICLE', language: lang }),
        seriesApi.getPopular({ limit: 10, language: lang }),
        categoryApi.getAll(),
        hashtagApi.getTrending(),
        fetchSiteCopy(['home'], lang),
        leaderboardApi.getTopWriters({ limit: 5, language: lang }),
      ]);
      if (trendRes.status === 'fulfilled') {
        const raw = trendRes.value.data?.data || trendRes.value.data || [];
        // Strict language filter — only show content in the selected language
        const inLang = raw.filter((t: any) => {
          const itemLang = t.language || t.content?.language;
          return itemLang === lang;
        });
        setTrending(inLang);
      }
      if (storyRes.status === 'fulfilled') setStories(storyRes.value.data?.data || storyRes.value.data || []);
      if (poemRes.status === 'fulfilled') setPoems(poemRes.value.data?.data || poemRes.value.data || []);
      if (articleRes.status === 'fulfilled') setArticles(articleRes.value.data?.data || articleRes.value.data || []);
      if (seriesRes.status === 'fulfilled') setSeries(seriesRes.value.data?.data || seriesRes.value.data || []);
      if (catRes.status === 'fulfilled') setCategories(catRes.value.data?.data || catRes.value.data || []);
      if (hashRes.status === 'fulfilled') setHashtags(hashRes.value.data?.data || hashRes.value.data || []);
      if (copyRes.status === 'fulfilled') setCopy(copyRes.value.home || {});
      if (lbRes.status === 'fulfilled') setTopWriters(lbRes.value.data?.data || []);

      // Load non-critical data in parallel (forYou, dailyTopic, liveRooms, banners, risingAuthors)
      const [fyRes, dtRes, liveRes2, bannerRes, risingRes] = await Promise.allSettled([
        feedApi.forYou({ limit: 8 }),
        dailyTopicApi.get(),
        liveApi.listRooms(),
        bannerApi.getActive(),
        leaderboardApi.getRisingAuthors({ limit: 6, language: lang }),
      ]);
      if (fyRes.status === 'fulfilled') setForYou(fyRes.value.data?.data || fyRes.value.data || []);
      if (dtRes.status === 'fulfilled') {
        const dt = dtRes.value.data?.data || dtRes.value.data;
        if (dt?.topic) setDailyTopic(dt);
      }
      if (liveRes2.status === 'fulfilled') {
        const rooms = liveRes2.value.data?.data || liveRes2.value.data || [];
        setLiveRooms(Array.isArray(rooms) ? rooms.filter((r: any) => r.isActive) : []);
      }
      if (bannerRes.status === 'fulfilled') setBanners(bannerRes.value.data?.data || bannerRes.value.data || []);
      if (risingRes.status === 'fulfilled') setRisingAuthors(risingRes.value.data?.data || []);
    } catch {} finally { setLoading(false); }
  };

  const cx = (key: string, fallback: string) => copy[key] || fallback;

  const allStories = stories;
  const allPoems = poems;
  const allArticles = articles;
  const allSeries = series;
  const allCategories = categories;
  const allHashtags = hashtags;
  const allTrending = trending;

  const writers = topWriters.length > 0
    ? topWriters.map((w: any) => ({ id: w.user.id, name: w.user.name, username: w.user.username, profileImage: w.user.profileImage, isVerified: w.user.isVerified, followersCount: w.stats.followers, contentCount: w.stats.contentCount }))
    : allStories
      .concat(allPoems, allArticles)
      .filter((c) => c.author?.name)
      .reduce((acc: any[], c) => {
        if (!acc.find((w) => w.id === c.author.id)) acc.push(c.author);
        return acc;
      }, [])
      .slice(0, 12);

  const getCategoryEmoji = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('love') || n.includes('romance') || n.includes('ಪ್ರೇಮ') || n.includes('प्रेम')) return '💕';
    if (n.includes('horror') || n.includes('ಭಯ') || n.includes('भय')) return '👻';
    if (n.includes('comedy') || n.includes('humor') || n.includes('ಹಾಸ್ಯ') || n.includes('हास्य')) return '😄';
    if (n.includes('drama') || n.includes('ನಾಟಕ') || n.includes('नाटक')) return '🎭';
    if (n.includes('thriller') || n.includes('mystery') || n.includes('ರಹಸ್ಯ')) return '🔍';
    if (n.includes('fantasy') || n.includes('ಕಲ್ಪನೆ')) return '✨';
    if (n.includes('sci') || n.includes('fiction') || n.includes('ವಿಜ್ಞಾನ')) return '🚀';
    if (n.includes('history') || n.includes('ಇತಿಹಾಸ') || n.includes('इतिहास')) return '📜';
    if (n.includes('spiritual') || n.includes('ಆಧ್ಯಾತ್ಮ') || n.includes('आध्यात्म')) return '🙏';
    if (n.includes('nature') || n.includes('ಪ್ರಕೃತಿ') || n.includes('प्रकृति')) return '🌿';
    if (n.includes('life') || n.includes('ಜೀವನ') || n.includes('जीवन')) return '🌅';
    if (n.includes('motivat') || n.includes('inspir') || n.includes('ಪ್ರೇರಣ')) return '💪';
    if (n.includes('child') || n.includes('kid') || n.includes('ಮಕ್ಕಳ') || n.includes('बच्च')) return '🧒';
    if (n.includes('travel') || n.includes('ಪ್ರವಾಸ') || n.includes('यात्रा')) return '✈️';
    if (n.includes('food') || n.includes('ಆಹಾರ') || n.includes('खाना')) return '🍳';
    if (n.includes('social') || n.includes('ಸಾಮಾಜಿಕ') || n.includes('सामाजिक')) return '🤝';
    if (n.includes('poem') || n.includes('poetry') || n.includes('ಕವಿತೆ') || n.includes('कविता')) return '📝';
    if (n.includes('story') || n.includes('ಕಥೆ') || n.includes('कहानी')) return '📖';
    return '📚';
  };

  if (loading) {
    return (
      <div className="py-4 lg:py-6 space-y-8 lg:space-y-10 pb-28 lg:pb-6">
        {/* Live avatars skeleton */}
        <div className="px-4 lg:px-6">
          <div className="flex gap-5 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="skeleton w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-full" />
                <div className="skeleton w-12 h-2.5 rounded" />
              </div>
            ))}
          </div>
        </div>
        {/* Hero skeleton */}
        <div className="px-4 lg:px-6">
          <div className="skeleton h-[180px] lg:h-[220px] rounded-2xl" />
        </div>
        {/* Section skeleton */}
        <div className="px-4 lg:px-6 space-y-3">
          <div className="skeleton h-5 w-40 rounded" />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(5)].map((_, i) => <BookCardSkeleton key={i} />)}
          </div>
        </div>
        {/* Feed skeleton */}
        <div className="px-4 lg:px-6 space-y-4">
          <div className="skeleton h-5 w-36 rounded" />
          {[...Array(3)].map((_, i) => <ContentCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    // TODO: migrate to <PageContainer> — current layout pads each section
    // individually (`px-4 lg:px-6` per child). Migrating requires hoisting
    // padding to a single container and dropping per-section classes; tracked
    // separately to avoid a large diff.
    <div className="py-4 lg:py-6 space-y-8 lg:space-y-10 pb-28 lg:pb-6">

      {/* LIVE NOW — Circular Avatars */}
      {liveRooms.length > 0 && (
        <div className="px-4 lg:px-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Live Now</span>
          </div>
          <HScroll className="gap-5">
            {liveRooms.map((room: any) => (
              <Link key={room.id} href={`/live/${room.id}`} className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
                <div className="relative">
                  <div className="w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-full p-[3px] bg-gradient-to-br from-red-500 via-orange-500 to-pink-500 animate-pulse">
                    <div className="w-full h-full rounded-full border-2 border-white dark:border-warm-950 overflow-hidden">
                      <Avatar src={room.hostImage} name={room.hostName} size="xl" />
                    </div>
                  </div>
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-red-500 rounded-full">
                    <span className="text-[9px] font-bold text-white uppercase">Live</span>
                  </div>
                </div>
                <span className="text-[11px] text-warm-600 dark:text-warm-400 text-center w-16 truncate group-hover:text-primary transition-colors">
                  {room.hostName?.split(' ')[0]}
                </span>
                <span className="text-[9px] text-warm-400 flex items-center gap-0.5">
                  <Users className="w-2.5 h-2.5" /> {room.listenerCount || 0}
                </span>
              </Link>
            ))}
          </HScroll>
        </div>
      )}

      {/* PROMOTIONAL CAROUSEL BANNER */}
      {banners.length > 0 && (
        <div className="px-4 lg:px-6">
          <Carousel
            items={banners}
            autoPlay
            interval={5000}
            renderItem={(banner: any, index: number) => (
              <Link href={banner.deepLink || banner.link || '/discover'}>
                <div className="relative overflow-hidden rounded-2xl aspect-[21/9] lg:aspect-[3/1] bg-gradient-to-br from-primary/10 to-accent/10">
                  {banner.imageUrl ? (
                    // First banner is above-the-fold on home — mark as priority for LCP.
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title || ''}
                      fill
                      sizes="(max-width: 768px) 100vw, 1024px"
                      priority={index === 0}
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full p-6">
                      <div>
                        <h3 className="text-xl lg:text-2xl font-bold text-warm-900 dark:text-warm-50">{banner.title}</h3>
                        {banner.subtitle && <p className="text-sm text-warm-500 mt-1">{banner.subtitle}</p>}
                      </div>
                    </div>
                  )}
                  {banner.title && banner.imageUrl && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <h3 className="text-white font-semibold text-sm lg:text-base">{banner.title}</h3>
                    </div>
                  )}
                </div>
              </Link>
            )}
          />
        </div>
      )}

      {/* ═══ WRITING PROMPT ═══ */}
      {dailyTopic?.topic && (
      <div className="px-4 lg:px-6">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <PenTool className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary/70">Writing Prompt</p>
            <p className="text-sm font-semibold text-warm-900 dark:text-warm-100 truncate">{dailyTopic.topicKn || dailyTopic.topic}</p>
          </div>
          <Link
            href={`/create?topic=${encodeURIComponent(dailyTopic.topicKn || dailyTopic.topic)}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition-colors flex-shrink-0"
          >
            <Feather className="w-3 h-3" /> Write
          </Link>
        </div>
      </div>
      )}

      {/* ═══ FOR YOU (personalized / trending fallback) ═══ */}
      {forYou.length > 0 && (
      <div className="px-4 lg:px-6">
        <SectionHeader
          title={isAuthenticated ? (cx('forYouTitle', 'For You')) : (cx('forYouTitle', 'Popular reads'))}
          subtitle={isAuthenticated ? 'Picked based on your reading' : 'Trending with readers today'}
          href="/discover"
        />
        <HScroll>
          {forYou.slice(0, 8).map((item: any) => (
            <BookCard key={item.id} item={item} />
          ))}
        </HScroll>
      </div>
      )}

      {/* ═══ TOP TRENDING SERIES ═══ */}
      <div className="px-4 lg:px-6">
        <SectionHeader
          title={cx('seriesTitle', 'Top trending series')}
          subtitle={cx('seriesSubtitle', 'Most popular this week')}
          href="/discover?tab=series"
        />
        {allSeries.length === 0 ? (
          <p className="text-sm text-warm-500 py-6 text-center">{cx('emptyFeed', 'Nothing here yet — try Discover or another language.')}</p>
        ) : (
          <HScroll>
            {allSeries.slice(0, 6).map((s: any, i: number) => (
              <BookCard key={s.id} item={s} type="series" rank={i + 1} />
            ))}
          </HScroll>
        )}
      </div>

      {/* ═══ EXPLORE CATEGORIES ═══ */}
      {allCategories.length > 0 && (
        <div className="px-4 lg:px-6">
          <SectionHeader title={cx('categoriesTitle', 'Explore categories')} href="/discover" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {allCategories.slice(0, 8).map((cat: any) => (
              <Link key={cat.id} href={`/category/${cat.slug || cat.id}`} className="group">
                <div className="relative overflow-hidden rounded-xl aspect-[3/2]">
                  {cat.iconUrl || cat.image ? (
                    <>
                      <FallbackImage
                        src={cat.iconUrl || cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        fallbackClassName="w-full h-full bg-warm-100 dark:bg-warm-800 flex items-center justify-center group-hover:scale-105 transition-transform duration-500"
                        fallbackIconClassName="text-3xl"
                        fallbackIcon={BookOpen}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-warm-100 dark:bg-warm-800 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                      <span className="text-3xl">{getCategoryEmoji(cat.name)}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-end p-3">
                    <span className="text-white font-bold text-sm drop-shadow-lg">{cat.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {allCategories.length > 8 && (
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
              {allCategories.slice(8).map((cat: any) => (
                <Link key={cat.id} href={`/category/${cat.slug || cat.id}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-warm-900 rounded-full border border-warm-100 dark:border-warm-800 hover:border-primary/30 transition-all text-xs flex-shrink-0">
                  <span>{getCategoryEmoji(cat.name)}</span>
                  <span className="text-warm-700 dark:text-warm-300 font-medium">{cat.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ FEATURED WRITERS ═══ */}
      {writers.length > 0 && (
      <div className="px-4 lg:px-6">
        <SectionHeader title={cx('writersTitle', 'Featured writers')} subtitle={cx('writersSubtitle', 'Creators to follow')} href="/discover" />
        <HScroll>
          {writers.map((w: any) => (
            <WriterCard key={w.id} writer={w} />
          ))}
        </HScroll>
      </div>
      )}

      {/* ═══ TOP WRITERS LEADERBOARD (mini — horizontal scroll on mobile) ═══ */}
      {topWriters.length > 0 && (
      <div className="px-4 lg:px-6">
        <SectionHeader title={cx('leaderboardTitle', 'Top Writers')} subtitle="This month's best" href="/leaderboard" actionLabel="View Full Leaderboard" />
        {/* Mobile: horizontal scroll cards */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 lg:hidden">
          {topWriters.map((entry: any) => {
            const { rank, user: w, stats } = entry;
            return (
              <Link key={w.id} href={`/user/${w.username}`} className="group flex-shrink-0 w-[140px]">
                <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 p-3 text-center hover:border-primary/20 transition-all">
                  <div className="relative w-fit mx-auto mb-2">
                    <Avatar src={w.profileImage} name={w.name} size="md" />
                    {rank <= 3 && (
                      <div className={cn(
                        'absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow',
                        rank === 1 && 'bg-gradient-to-br from-amber-300 to-yellow-500',
                        rank === 2 && 'bg-gradient-to-br from-gray-300 to-gray-400',
                        rank === 3 && 'bg-gradient-to-br from-amber-600 to-orange-700'
                      )}>
                        {rank === 1 ? <Crown className="w-2.5 h-2.5" /> : <Medal className="w-2.5 h-2.5" />}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-warm-800 dark:text-warm-200 truncate group-hover:text-primary transition-colors">{w.name}</p>
                  <div className="flex items-center justify-center gap-1 mt-1 text-[10px] text-warm-400">
                    <Eye className="w-2.5 h-2.5" />
                    <span>{formatNumber(stats.views)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {/* Desktop: vertical list */}
        <div className="hidden lg:block bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 overflow-hidden">
          {topWriters.map((entry: any, i: number) => {
            const { rank, user: w, stats } = entry;
            return (
              <Link key={w.id} href={`/user/${w.username}`} className="group">
                <div className={cn(
                  'flex items-center gap-3 px-4 py-3 transition-all hover:bg-warm-50 dark:hover:bg-warm-800/50',
                  i !== topWriters.length - 1 && 'border-b border-warm-50 dark:border-warm-800'
                )}>
                  {rank === 1 ? (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 flex items-center justify-center flex-shrink-0">
                      <Crown className="w-3.5 h-3.5 text-white" />
                    </div>
                  ) : rank === 2 ? (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center flex-shrink-0">
                      <Medal className="w-3.5 h-3.5 text-white" />
                    </div>
                  ) : rank === 3 ? (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center flex-shrink-0">
                      <Medal className="w-3.5 h-3.5 text-white" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-warm-100 dark:bg-warm-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-warm-500">#{rank}</span>
                    </div>
                  )}
                  <Avatar src={w.profileImage} name={w.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium text-warm-800 dark:text-warm-200 truncate group-hover:text-primary transition-colors">{w.name}</p>
                      {w.isVerified && (
                        <div className="w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <Star className="w-2 h-2 text-white fill-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-warm-400">@{w.username}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-warm-500 flex-shrink-0">
                    <Eye className="w-3 h-3" />
                    <span className="font-medium">{formatNumber(stats.views)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      )}

      {/* ═══ RISING AUTHORS (new voices this month) ═══ */}
      {risingAuthors.length > 0 && (
      <div className="px-4 lg:px-6">
        <SectionHeader title="Rising Authors" subtitle="New voices this month" href="/leaderboard" />
        <HScroll>
          {risingAuthors.map((entry: any) => (
            <Link key={entry.user.id} href={`/user/${entry.user.username}`} className="flex-shrink-0 w-36">
              <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-warm-900 border border-warm-100 dark:border-warm-800 hover:border-primary/30 hover:shadow-md transition-all text-center">
                <div className="relative">
                  <Avatar src={entry.user.profileImage} name={entry.user.name} size="lg" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center border-2 border-white dark:border-warm-900">
                    <TrendingUp className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-warm-900 dark:text-warm-100 truncate w-full">{entry.user.name}</p>
                  <p className="text-[10px] text-warm-400">{entry.stats.joinedDaysAgo}d ago · {entry.stats.contentCount} posts</p>
                </div>
              </div>
            </Link>
          ))}
        </HScroll>
      </div>
      )}

      {/* ═══ TRENDING NOW (Pratilipi-style featured + grid) ═══ */}
      {allTrending.length > 0 && (
      <div className="px-4 lg:px-6">
        <SectionHeader title={cx('trendingTitle', 'Trending now')} subtitle={cx('trendingSubtitle', 'What readers are opening today')} href="/discover?tab=trending" />
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-[10px] font-medium text-warm-400 uppercase tracking-wide">Updated daily</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Featured card */}
          {(() => {
            const first = allTrending[0]?.content || allTrending[0];
            if (!first) return null;
            const author = first.author || {};
            const wordCount = first.body?.split(/\s+/).length || 0;
            return (
              <Link href={`/content/${first.id}`} className="group lg:col-span-2">
                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-warm-900 border border-warm-100 dark:border-warm-800 hover:border-primary/20 transition-all hover:shadow-lg">
                  <div className="flex flex-col md:flex-row">
                    {first.coverImage && (
                      <div className="md:w-2/5 aspect-[2/1] md:aspect-auto md:min-h-[220px] overflow-hidden relative bg-warm-100 dark:bg-warm-800">
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
                    <div className="flex-1 p-5 lg:p-6 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="primary" size="sm"><Flame className="w-3 h-3 mr-1" /> Trending #1</Badge>
                        <span className="text-[10px] text-warm-400">{readingTime(wordCount)}</span>
                        {first.partsCount > 1 && (
                          <span className="text-[10px] text-warm-400">{first.partsCount} parts</span>
                        )}
                      </div>
                      <h3 className="text-xl lg:text-2xl font-bold text-warm-900 dark:text-warm-50 mb-2 group-hover:text-primary transition-colors">{first.title}</h3>
                      <p className="text-sm text-warm-500 line-clamp-2 mb-4">{first.excerpt || (first.body ? stripHtml(first.body).slice(0, 150) : '')}</p>
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
          {allTrending.slice(1, 7).map((item: any, i: number) => {
            const c = item.content || item;
            return <ContentCard key={c.id} content={c} variant="compact" rank={i + 2} />;
          })}
        </div>
      </div>
      )}

      {/* ═══ HASHTAGS ═══ */}
      {allHashtags.length > 0 && (
      <div className="px-4 lg:px-6">
        <SectionHeader title="Trending Topics" />
        <div className="flex gap-2 flex-wrap">
          {allHashtags.slice(0, 10).map((h: any) => (
            <Link key={h.id || h.tag} href={`/hashtag/${h.tag || h.name}`}>
              <div className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 hover:border-primary/30 hover:bg-primary/5 transition-all text-sm">
                <Hash className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium text-warm-700 dark:text-warm-300">{h.tag || h.name}</span>
                {h.count && <span className="text-[10px] text-warm-400 ml-1">{formatNumber(h.count)}</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
      )}

      {/* ═══ NEW STORIES (with series grouping) ═══ */}
      {allStories.length > 0 && (() => {
        // Group episodes: if content is part of a series, show one card per series
        const seenSeriesIds = new Set<string>();
        const groupedStories: any[] = [];

        for (const s of allStories) {
          const seriesId = s.seriesId || s.series?.id;
          if (seriesId) {
            if (seenSeriesIds.has(seriesId)) continue; // skip duplicate series episodes
            seenSeriesIds.add(seriesId);
            groupedStories.push({ ...s, _isSeriesEpisode: true });
          } else {
            groupedStories.push(s);
          }
        }

        return (
          <div className="px-4 lg:px-6">
            <SectionHeader title={cx('newStoriesTitle', 'New stories')} subtitle={cx('newStoriesSubtitle', 'Fresh reads')} href="/discover?type=STORY" />
            <HScroll>
              {groupedStories.slice(0, 10).map((s: any) => {
                if (s._isSeriesEpisode && (s.seriesId || s.series?.id)) {
                  const seriesData = s.series || {};
                  return (
                    <Link
                      key={`series-${s.seriesId || seriesData.id}`}
                      href={`/series/${s.seriesId || seriesData.id}`}
                      className="group flex-shrink-0 w-[140px]"
                    >
                      <div className="w-[140px] rounded-2xl overflow-hidden border border-primary/20 bg-primary/5 dark:bg-primary/10 hover-lift">
                        <div className="aspect-[3/4] overflow-hidden bg-warm-100 dark:bg-warm-800 relative">
                          {(seriesData.coverImage || s.coverImage) ? (
                            <FallbackImage
                              src={seriesData.coverImage || s.coverImage}
                              alt={(seriesData.title || s.title || 'Series').slice(0, 100)}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              fallbackClassName="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                              fallbackIcon={BookOpen}
                              fallbackIconClassName="w-8 h-8 text-warm-300 dark:text-warm-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                              <BookOpen className="w-8 h-8 text-warm-300" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary text-white text-[9px] font-bold uppercase">
                            New Episode
                          </div>
                        </div>
                        <div className="p-2.5">
                          <p className="text-[10px] text-primary font-semibold mb-0.5 truncate">
                            {seriesData.title || 'Series'}
                          </p>
                          <p className="text-xs font-medium text-warm-800 dark:text-warm-200 line-clamp-2 leading-snug">
                            {s.title}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                }
                return <BookCard key={s.id} item={s} />;
              })}
            </HScroll>
          </div>
        );
      })()}

      {/* ═══ POEMS ═══ */}
      {allPoems.length > 0 && (
      <div className="px-4 lg:px-6">
        <SectionHeader title={cx('poemsTitle', 'Poems')} subtitle={cx('poemsSubtitle', 'Short reads, deep feelings')} href="/discover?type=POEM" />
        <div className="grid gap-3 lg:grid-cols-2">
          {allPoems.slice(0, 6).map((poem: any) => {
            const author = poem.author || {};
            return (
              <Link key={poem.id} href={`/content/${poem.id}`} className="group">
                <div className="flex gap-4 p-4 bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 hover:border-primary/20 hover:shadow-sm transition-all">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center flex-shrink-0 text-lg">🪶</div>
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

      {/* ═══ POPULAR SERIES ═══ */}
      {allSeries.length > 3 && (
      <div className="px-4 lg:px-6">
        <SectionHeader title={cx('popularSeriesTitle', 'Popular series')} subtitle={cx('popularSeriesSubtitle', 'Multi-part stories')} href="/discover?tab=series" />
        <HScroll>
          {allSeries.slice(3).map((s: any) => (
            <BookCard key={s.id} item={s} type="series" />
          ))}
        </HScroll>
      </div>
      )}

      {/* ═══ ARTICLES ═══ */}
      {allArticles.length > 0 && (
      <div className="px-4 lg:px-6">
        <SectionHeader title={cx('articlesTitle', 'Articles')} subtitle={cx('articlesSubtitle', 'Long-form reads')} href="/discover?type=ARTICLE" />
        <div className="grid gap-4 lg:grid-cols-2">
          {allArticles.slice(0, 4).map((a: any) => (
            <ContentCard key={a.id} content={a} variant="grid" />
          ))}
        </div>
      </div>
      )}

      {/* ═══ PREMIUM BANNER ═══ */}
      <div className="px-4 lg:px-6">
        <div className="rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-yellow-950/20 border border-amber-200/50 dark:border-amber-800/30 p-5 lg:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
              <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-warm-900 dark:text-warm-100 text-lg">{cx('premiumTitle', 'Go premium')}</h3>
              <p className="text-sm text-warm-500 mt-0.5">{cx('premiumSubtitle', 'Ad-light reading and more perks for serious readers')}</p>
            </div>
            <Link href="/subscription" className="w-full sm:w-auto text-center px-5 py-3 min-h-[44px] inline-flex items-center justify-center bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all whitespace-nowrap">
              {cx('premiumCta', 'View plans')}
            </Link>
          </div>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <div className="px-4 lg:px-6 pt-4 pb-2 border-t border-warm-100 dark:border-warm-800">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-warm-400">
          <Link href="/about" className="hover:text-primary transition-colors">About</Link>
          <Link href="/help" className="hover:text-primary transition-colors">Help & FAQ</Link>
          <Link href="/subscription" className="hover:text-primary transition-colors">Premium</Link>
          <Link href="/competitions" className="hover:text-primary transition-colors">Competitions</Link>
          <a href="mailto:support@kalaloka.buzz" className="hover:text-primary transition-colors">Contact</a>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-warm-300 dark:text-warm-600 mt-2">
          <Link href="/terms" className="hover:text-warm-500 transition-colors">Terms</Link>
          <Link href="/privacy-policy" className="hover:text-warm-500 transition-colors">Privacy</Link>
          <Link href="/community-guidelines" className="hover:text-warm-500 transition-colors">Guidelines</Link>
          <Link href="/refund-policy" className="hover:text-warm-500 transition-colors">Refund</Link>
          <Link href="/copyright" className="hover:text-warm-500 transition-colors">Copyright</Link>
          <Link href="/grievance-redressal" className="hover:text-warm-500 transition-colors">Grievance</Link>
        </div>
        <p className="text-[10px] text-warm-300 dark:text-warm-700 mt-2">&copy; {new Date().getFullYear()} Kalaloka by DigiYogi. Write. Read. Connect.</p>
      </div>
    </div>
  );
}
