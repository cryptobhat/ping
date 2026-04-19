'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { seriesApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft, BookOpen, Users, Crown, Lock, ChevronRight, Heart, Library, Plus, Eye, Play, PenTool,
  MoreHorizontal, Trash2, Edit3,
} from 'lucide-react';
import { cn, formatNumber, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

function SeriesCover({ coverImage, title }: { coverImage?: string; title: string }) {
  const [imgError, setImgError] = useState(false);
  const showImg = !!coverImage && !imgError;
  return (
    <div className="w-full xs:w-28 sm:w-36 flex-shrink-0 aspect-[3/4] max-w-[160px] mx-auto xs:mx-0 rounded-xl overflow-hidden bg-warm-100 dark:bg-warm-800 shadow-md">
      {showImg ? (
        <img
          src={coverImage}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/80 via-primary-dark/70 to-accent/80 flex flex-col items-center justify-center p-3 gap-2">
          <BookOpen className="w-8 h-8 text-white/60" />
          <span className="text-center text-sm font-semibold text-white leading-tight line-clamp-3 drop-shadow">{title}</span>
        </div>
      )}
    </div>
  );
}

export default function SeriesDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [following, setFollowing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setNotFound(false);
      setSeries(null);
      try {
        const { data } = await seriesApi.getById(id as string);
        const s = data?.data ?? data;
        if (!s?.id) {
          setNotFound(true);
          setSeries(null);
        } else {
          setSeries(s);
          setFollowing(!!s?.isFollowing);
        }
      } catch {
        setSeries(null);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const toggleFollow = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to follow series');
      router.push(`/login?next=/series/${id}`);
      return;
    }
    try {
      const { data } = await seriesApi.follow(id as string);
      const r = data?.data ?? data;
      const now = typeof r?.following === 'boolean' ? r.following : !following;
      setFollowing(now);
      toast.success(now ? 'Following' : 'Unfollowed');
    } catch {
      toast.error('Could not update follow');
    }
  };

  const handleDeleteSeries = async () => {
    if (!window.confirm('Delete this series and unlink all episodes? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await seriesApi.delete(id as string);
      toast.success('Series deleted');
      router.push('/library');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete series');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-8 space-y-4 max-w-3xl mx-auto">
        <div className="skeleton h-8 w-1/2 rounded-lg" />
        <div className="skeleton h-48 rounded-2xl" />
        <div className="skeleton h-24 rounded-xl" />
      </div>
    );
  }

  if (notFound || !series) {
    return (
      <div className="px-4 py-16 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center mx-auto mb-4">
          <Library className="w-8 h-8 text-warm-400" />
        </div>
        <h1 className="text-xl font-bold text-warm-900 dark:text-warm-50 mb-2">Series not found</h1>
        <p className="text-sm text-warm-500 mb-6">
          This link may be outdated, or the series ID is wrong. Open Series from the browse page to use a valid link.
        </p>
        <Button variant="primary" size="sm" onClick={() => router.push('/series')}>
          Browse series
        </Button>
      </div>
    );
  }

  const author = series.author || {};
  const items = [...(series.items || [])].sort(
    (a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  return (
    <div className="pb-28 lg:pb-12">
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-warm-950/95 backdrop-blur border-b border-warm-100 dark:border-warm-800">
        <div className="flex items-center gap-2 px-4 h-12 max-w-3xl mx-auto">
          <button type="button" onClick={() => router.back()} className="p-2 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-lg -ml-2">
            <ArrowLeft className="w-5 h-5 text-warm-600" />
          </button>
          <span className="text-sm font-medium text-warm-700 dark:text-warm-200 truncate">Series</span>
          {isAuthenticated && user?.id === author.id && (
            <div className="relative ml-auto">
              <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-lg">
                <MoreHorizontal className="w-5 h-5 text-warm-600" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white dark:bg-warm-900 rounded-xl shadow-xl border border-warm-100 dark:border-warm-800 py-1.5">
                    <button
                      onClick={handleDeleteSeries}
                      disabled={deleting}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 w-full text-left"
                    >
                      <Trash2 className="w-4 h-4" /> {deleting ? 'Deleting...' : 'Delete Series'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 lg:px-6 pt-6 max-w-3xl mx-auto">
        <div className="flex flex-col xs:flex-row gap-4 xs:gap-5">
          <SeriesCover coverImage={series.coverImage} title={series.title} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="primary" size="sm">{series.status || 'ONGOING'}</Badge>
              {series.isPremium && (
                <Badge variant="warning" size="sm" className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200/50">
                  <Crown className="w-3 h-3 mr-1" /> Some paid episodes
                </Badge>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-warm-900 dark:text-warm-50 leading-tight mb-2">{series.title}</h1>
            <Link href={`/user/${author.username}`} className="flex items-center gap-2 group mb-3">
              <Avatar src={author.profileImage} name={author.name || 'Author'} size="sm" />
              <span className="text-sm font-medium text-warm-700 dark:text-warm-200 group-hover:text-primary">{author.name}</span>
            </Link>
            {series.description && (
              <p className="text-sm text-warm-500 line-clamp-3 leading-relaxed">{series.description}</p>
            )}
            <div className="flex items-center gap-4 mt-4 text-xs text-warm-400">
              <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {items.length} episodes</span>
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {formatNumber(series.followerCount || series._count?.followers || 0)} followers</span>
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {formatNumber(series.viewCount || 0)} views</span>
            </div>
            <div className="flex items-center gap-2 mt-4 flex-wrap justify-center xs:justify-start">
              {items.length > 0 && (
                <Button variant="primary" size="sm" onClick={() => router.push(`/content/${items[0].content?.id}`)}>
                  <Play className="w-4 h-4 mr-1.5" />
                  Start Reading
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={toggleFollow}>
                <Heart className={cn('w-4 h-4 mr-1.5', following && 'fill-current')} />
                {following ? 'Following' : 'Follow series'}
              </Button>
              {isAuthenticated && user?.id === author.id && (
                <Button variant="secondary" size="sm" onClick={() => router.push(`/create?seriesId=${id}`)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Chapter
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-warm-900 dark:text-warm-50">Episodes</h2>
            {isAuthenticated && user?.id === author.id && (
              <Link href={`/create?seriesId=${id}`} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                <Plus className="w-4 h-4" /> Add Chapter
              </Link>
            )}
          </div>
          {items.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-warm-200 dark:border-warm-700 p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <PenTool className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-warm-800 dark:text-warm-100 mb-2">Write your first episode</h3>
              <p className="text-sm text-warm-500 mb-6 max-w-xs mx-auto">Every great series starts with a first chapter. Begin your story and build your readership.</p>
              {isAuthenticated && user?.id === author.id && (
                <Button variant="primary" size="md" onClick={() => router.push(`/create?seriesId=${id}`)}>
                  <PenTool className="w-4 h-4 mr-2" /> Write First Episode
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {items.map((item: any, idx: number) => {
                  const c = item.content;
                  if (!c) return null;
                  const premium = !!c.isPremium;
                  const locked = !!c.unlockPrice;
                  const isFree = !premium && !locked;
                  return (
                    <Link
                      key={item.id}
                      href={`/content/${c.id}`}
                      className="group rounded-xl border border-warm-100 dark:border-warm-800 bg-white dark:bg-warm-900 hover:border-primary/30 hover:shadow-sm transition-all"
                    >
                      <div className="px-4 py-3.5">
                        {/* Number + Title + Date — Pratilipi style */}
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-base font-bold text-warm-400 tabular-nums mt-0.5">{idx + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-warm-900 dark:text-warm-100 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                              {c.title || `Episode ${idx + 1}`}
                            </p>
                            {item.addedAt && (
                              <p className="text-xs text-warm-400 mt-1">{formatDate(item.addedAt)}</p>
                            )}
                          </div>
                          {(premium || locked) && (
                            <Lock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-1" />
                          )}
                        </div>
                        {/* Stats — only for free/readable episodes */}
                        {isFree && (
                          <div className="flex items-center gap-3 text-xs text-warm-400 ml-6">
                            {(c.viewCount > 0 || c.viewsCount > 0) && (
                              <span className="flex items-center gap-1">👁 {formatNumber(c.viewCount || c.viewsCount || 0)}</span>
                            )}
                            {c.likeCount > 0 && (
                              <span className="flex items-center gap-1">❤ {formatNumber(c.likeCount)}</span>
                            )}
                            {c.readTime > 0 && (
                              <span className="flex items-center gap-1">🕐 {c.readTime} min</span>
                            )}
                          </div>
                        )}
                        {/* Locked message */}
                        {!isFree && (
                          <p className="text-xs text-warm-400 ml-6 mt-1">
                            {locked ? `🔒 ${c.unlockPrice} Points to unlock` : '🔒 Premium subscribers only'}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
              {/* Full-width Add Chapter button below episode list */}
              {isAuthenticated && user?.id === author.id && (
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full mt-4"
                  onClick={() => router.push(`/create?seriesId=${id}`)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Next Episode
                </Button>
              )}
            </>
          )}
        </div>

        <p className="text-xs text-warm-400 mt-8 text-center">
          Sign in with your phone to read. Premium episodes need an active subscription.
        </p>
      </div>
    </div>
  );
}
