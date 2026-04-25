'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { contentApi, commentApi, bookmarkApi, readingApi, rewardsApi, creatorApi, giftApi, aiWritingApi, followApi, liveApi, ratingApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Heart, MessageCircle, Bookmark, ArrowLeft, Eye, Clock,
  Type, Sun, Moon, BookOpen, Settings2, Send, Gift, Star, Minus, Plus,
  ChevronRight, Lock, Crown, Phone, Flag, MoreHorizontal, Edit3, EyeOff, Trash2,
  X, Coins, Check, Gem, Headphones, Play, Pause, Volume2, Sparkles, CreditCard,
  UserPlus, UserMinus, Radio,
} from 'lucide-react';
import { cn, formatDate, formatNumber, readingTime, getContentTypeEmoji } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { FallbackImage } from '@/components/ui/FallbackImage';
import { ShareButtons } from '@/components/share/ShareButtons';
import { ReportContentModal } from '@/components/moderation/ReportContentModal';
import { AdSenseSlot } from '@/components/ads/AdSenseSlot';

/** Strip script tags, event handlers, and dangerous attributes from HTML */
function sanitizeHtml(html: string): string {
  if (!html) return '';
  return html
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handler attributes (onclick, onerror, onload, etc.)
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Remove javascript: URLs
    .replace(/javascript\s*:/gi, '')
    // Remove data: URLs in href/src (potential XSS vector)
    .replace(/(href|src)\s*=\s*["']?\s*data\s*:/gi, '$1="')
    // Remove style expressions (IE)
    .replace(/expression\s*\(/gi, '')
    // Remove iframe/embed/object tags
    .replace(/<(iframe|embed|object|applet|form)\b[^>]*>.*?<\/\1>/gi, '')
    .replace(/<(iframe|embed|object|applet|form)\b[^>]*\/?>/gi, '');
}

/** Check if body contains HTML tags (rich text) vs plain text */
function isHtmlContent(body: string): boolean {
  if (!body) return false;
  return /<[a-z][\s\S]*>/i.test(body);
}

const themes = [
  { id: 'light', label: 'Light', bg: 'bg-[#FAFAF8]', text: 'text-[#2C2C2C]', icon: Sun },
  { id: 'sepia', label: 'Sepia', bg: 'bg-[#F4ECD8]', text: 'text-[#5B4636]', icon: BookOpen },
  { id: 'dark', label: 'Dark', bg: 'bg-[#1A1A2E]', text: 'text-[#D4D4D8]', icon: Moon },
];

type CatalogGift = {
  id: string;
  name: string;
  description?: string | null;
  coinPrice: number;
  iconEmoji?: string | null;
  imageUrl?: string | null;
};

export default function ContentPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [content, setContent] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'read' | 'discuss' | 'details'>('read');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [readProgress, setReadProgress] = useState(0);
  const [theme, setTheme] = useState('sepia');
  const [fontSize, setFontSize] = useState(18);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [related, setRelated] = useState<any[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showAuthorMenu, setShowAuthorMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftCatalog, setGiftCatalog] = useState<CatalogGift[]>([]);
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const [sendingGift, setSendingGift] = useState(false);
  const [giftSuccess, setGiftSuccess] = useState<string | null>(null);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  // Author rating
  const [authorRating, setAuthorRating] = useState<{ avg: number; count: number } | null>(null);
  // Audio player state
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioSpeed, setAudioSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Story teaser
  const [storyTeaser, setStoryTeaser] = useState<string | null>(null);
  const [nextEpisodeId, setNextEpisodeId] = useState<string | null>(null);
  // Follow author
  const [followingAuthor, setFollowingAuthor] = useState(false);
  // Razorpay unlock
  const [unlockingPay, setUnlockingPay] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const readProgressRef = useRef(0);
  const sessionEndedRef = useRef(false);
  const wordCountRef = useRef(0);

  useEffect(() => { loadContent(); }, [id, user?.id]);

  // Load Razorpay script for content unlock payments
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    setShareUrl(typeof window !== 'undefined' ? window.location.href : '');
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const rect = contentRef.current.getBoundingClientRect();
      const total = contentRef.current.scrollHeight - window.innerHeight;
      const pct = Math.min(100, Math.max(0, (-rect.top / total) * 100));
      readProgressRef.current = pct;
      setReadProgress(pct);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadContent = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const { data } = await contentApi.getById(id as string);
      const c = data?.data || data;
      setContent(c);
      setLiked(c.isLiked || false);
      setLikeCount(c.likesCount || c.likeCount || c._count?.likes || 0);
      setBookmarked(c.isBookmarked || false);
      setFollowingAuthor(c.author?.isFollowing || c.isFollowingAuthor || false);
      loadComments();
      // Fetch author rating
      if (c.author?.id) {
        ratingApi.getAuthorRatings(c.author.id).then(({ data: rd }) => {
          const r = rd?.data || rd;
          if (r?.averageRating || r?.stats?._avg?.rating) {
            setAuthorRating({ avg: r.averageRating || r.stats?._avg?.rating || 0, count: r.totalRatings || r.total || 0 });
          }
        }).catch(() => {}); // Silently ignore rating errors
      }
      try {
        const feed = await contentApi.getFeed({
          limit: 8,
          contentType: c.contentType,
          language: c.language,
        });
        const list = feed.data?.data || feed.data || [];
        setRelated((Array.isArray(list) ? list : []).filter((x: any) => x.id !== c.id).slice(0, 4));
      } catch {
        setRelated([]);
      }
      // Fetch story teaser if content is part of a series
      aiWritingApi.storyTeaser(c.id).then(({ data: td }) => {
        const t = td?.data || td;
        if (t?.teaser) setStoryTeaser(t.teaser);
        if (t?.nextEpisodeId) setNextEpisodeId(t.nextEpisodeId);
      }).catch(() => {});
    } catch {
      setContent(null);
      setRelated([]);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try { const { data } = await commentApi.getComments(id as string); const list = data?.data || data || []; setComments(list); setCommentCount(list.length); } catch {}
  };

  useEffect(() => {
    const plainBody = content?.body?.replace(/<[^>]*>/g, '') || '';
    const w = plainBody.split(/\s+/).filter(Boolean).length || 0;
    wordCountRef.current = w;
  }, [content?.body]);

  useEffect(() => {
    if (!content?.id || !isAuthenticated || content.readingLocked || !content.body) return;
    sessionEndedRef.current = false;
    let cancelled = false;
    let sessionId: string | null = null;
    let startedAt = 0;
    const contentId = content.id;

    (async () => {
      try {
        const { data } = await readingApi.startSession(contentId);
        const sess = data?.data ?? data;
        const sid = sess?.id;
        if (cancelled || !sid) return;
        sessionId = sid;
        startedAt = Date.now();
      } catch {
        /* ignore */
      }
    })();

    const flush = async () => {
      if (!sessionId || !startedAt || sessionEndedRef.current) return;
      sessionEndedRef.current = true;
      const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      const pct = readProgressRef.current;
      const sid = sessionId;
      sessionId = null;
      try {
        await readingApi.endSession(sid, {
          durationSeconds: elapsed,
          wordsRead: Math.round((pct / 100) * wordCountRef.current),
          scrollPercentage: Math.round(Math.min(100, Math.max(0, pct))),
          isCompleted: pct >= 92,
        });
      } catch {
        /* ignore */
      }
      try {
        await rewardsApi.awardReading(contentId, Math.max(1, Math.floor(elapsed / 60)), pct >= 92);
      } catch {
        /* ignore */
      }
    };

    const onVis = () => {
      if (document.visibilityState === 'hidden') void flush();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      void flush();
    };
  }, [content?.id, content?.body, content?.readingLocked, isAuthenticated]);

  const openGiftModal = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to send gems');
      return;
    }
    setShowGiftModal(true);
    setSelectedGiftId(null);
    setGiftSuccess(null);
    if (giftCatalog.length === 0) {
      setLoadingGifts(true);
      try {
        const { data } = await giftApi.getAll();
        const list = data?.data ?? data ?? [];
        setGiftCatalog(Array.isArray(list) ? list : []);
      } catch {
        toast.error('Could not load gems');
      } finally {
        setLoadingGifts(false);
      }
    }
  };

  const sendGift = async () => {
    if (!selectedGiftId || !content?.author?.id) return;
    setSendingGift(true);
    try {
      await giftApi.send({ receiverId: content.author.id, giftId: selectedGiftId, message: '' });
      const gift = giftCatalog.find((g) => g.id === selectedGiftId);
      setGiftSuccess(gift?.name || 'Gift');
      setSelectedGiftId(null);
      // refresh user coins
      const { fetchUser } = useAuthStore.getState();
      fetchUser();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Could not send gem');
    } finally {
      setSendingGift(false);
    }
  };

  const handleFollowAuthor = async () => {
    if (!isAuthenticated) {
      router.push(`/login?next=/content/${id}`);
      return;
    }
    const authorId = content?.author?.id;
    if (!authorId) return;
    try {
      if (followingAuthor) await followApi.unfollow(authorId);
      else await followApi.follow(authorId);
      setFollowingAuthor(!followingAuthor);
      toast.success(followingAuthor ? 'Unfollowed' : 'Following!');
    } catch {
      toast.error('Could not update follow');
    }
  };

  const handleLike = async () => {
    try { await contentApi.toggleLike(id as string); setLiked(!liked); setLikeCount((p) => liked ? p - 1 : p + 1); } catch {}
  };

  const handleBookmark = async () => {
    try {
      if (bookmarked) await bookmarkApi.remove(id as string); else await bookmarkApi.add(id as string);
      setBookmarked(!bookmarked);
      toast.success(bookmarked ? 'Removed from bookmarks' : 'Saved!');
    } catch {}
  };

  const handleUnlockWithRazorpay = async () => {
    if (!isAuthenticated) { toast.error('Sign in first'); return; }
    setUnlockingPay(true);
    try {
      // 1. Create Razorpay order
      const { data: orderData } = await contentApi.unlockPay(id as string);
      const order = orderData?.data || orderData;

      // 2. Open Razorpay checkout
      const options = {
        key: order.keyId,
        amount: order.amount * 100,
        currency: order.currency || 'INR',
        name: 'Kalaloka',
        description: `Unlock: ${content?.title || 'Content'}`,
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await contentApi.verifyUnlockPay(id as string, {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            toast.success('Content unlocked!');
            loadContent(); // Reload to show full content
          } catch (e: any) {
            toast.error(e.response?.data?.message || 'Payment verification failed');
          }
        },
        theme: { color: '#E85D2C' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create payment');
    } finally {
      setUnlockingPay(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      await contentApi.update(id as string, { isDraft: true, visibility: 'PRIVATE' });
      toast.success('Content moved to drafts');
      setShowAuthorMenu(false);
      router.push('/library?tab=drafts');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to unpublish');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await contentApi.delete(id as string);
      toast.success('Content deleted');
      router.push('/profile');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      await commentApi.addComment(id as string, { body: commentText.trim(), parentId: replyingTo?.id });
      setCommentText(''); setReplyingTo(null); setCommentCount(prev => prev + 1); loadComments(); toast.success('Comment added');
    } catch { toast.error('Failed to add comment'); }
  };

  if (loading) {
    return (
      <div className="px-4 py-8 space-y-4 max-w-4xl mx-auto">
        <div className="skeleton h-8 w-3/4 rounded-lg" />
        <div className="skeleton h-4 w-1/3 rounded" />
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
      </div>
    );
  }

  if (notFound || !content) {
    return (
      <div className="px-4 py-16 text-center max-w-md mx-auto">
        <h1 className="text-xl font-bold text-warm-900 dark:text-warm-50 mb-2">Content not found</h1>
        <p className="text-sm text-warm-500 mb-6">This story may have been removed or the link is incorrect.</p>
        <Link href="/discover" className="text-primary font-medium hover:underline">
          Browse discover
        </Link>
      </div>
    );
  }

  const author = content.author || {};
  const isAuthor = !!(user?.id && author.id && user.id === author.id);
  const wordCount = (content.body?.replace(/<[^>]*>/g, '') || '').split(/\s+/).filter(Boolean).length || 0;
  const currentTheme = themes.find((t) => t.id === theme)!;
  const readingLocked = !!content.readingLocked;
  const lockReason = content.lockReason as 'login' | 'premium' | 'members_only' | 'coin_unlock' | undefined;

  return (
    <div className="min-h-screen">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-warm-100 dark:bg-warm-800 lg:ml-[260px]">
        <div className="h-full gradient-primary transition-all duration-150" style={{ width: `${readProgress}%` }} />
      </div>

      {/* Header - wider on desktop */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-warm-950/95 backdrop-blur-xl border-b border-warm-100 dark:border-warm-800">
        <div className="flex items-center justify-between px-4 lg:px-8 h-12 max-w-7xl mx-auto">
          <button onClick={() => router.back()} className="p-2 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-lg -ml-2">
            <ArrowLeft className="w-5 h-5 text-warm-600 dark:text-warm-400" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-0.5">
            <button onClick={() => setShowSettings(!showSettings)} className="flex items-center justify-center w-11 h-11 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-lg">
              <Settings2 className="w-5 h-5 text-warm-600 dark:text-warm-400" />
            </button>
            {isAuthor && (
              <div className="relative">
                <button onClick={() => setShowAuthorMenu(!showAuthorMenu)} className="p-2 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-lg">
                  <MoreHorizontal className="w-5 h-5 text-warm-600 dark:text-warm-400" />
                </button>
                {showAuthorMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowAuthorMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white dark:bg-warm-900 rounded-xl shadow-xl border border-warm-100 dark:border-warm-800 py-1.5 animate-scale-in">
                      <Link
                        href={`/create?editId=${id}`}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-warm-700 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
                        onClick={() => setShowAuthorMenu(false)}
                      >
                        <Edit3 className="w-4 h-4" /> Edit
                      </Link>
                      <button
                        onClick={async () => {
                          setShowAuthorMenu(false);
                          try {
                            const res = await liveApi.createRoom({ title: `Reading: ${content.title}`, contentId: id as string });
                            router.push(`/live/${res.data.data.id}`);
                          } catch { toast.error('Failed to start live reading'); }
                        }}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full text-left"
                      >
                        <Radio className="w-4 h-4" /> Read Live
                      </button>
                      <button
                        onClick={handleUnpublish}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-warm-700 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors w-full text-left"
                      >
                        <EyeOff className="w-4 h-4" /> Unpublish (move to drafts)
                      </button>
                      <div className="h-px bg-warm-100 dark:bg-warm-800 my-1" />
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full text-left"
                      >
                        <Trash2 className="w-4 h-4" /> {deleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Audio listen bar — full-width below header on mobile */}
        {content.audioUrl && (
          <div className="border-t border-warm-100 dark:border-warm-800 max-w-7xl mx-auto">
            <button
              onClick={() => setShowAudioPlayer(!showAudioPlayer)}
              className={cn(
                'flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium transition-all',
                showAudioPlayer ? 'bg-primary/10 text-primary' : 'text-warm-600 dark:text-warm-400 hover:bg-warm-50 dark:hover:bg-warm-800/50'
              )}
            >
              <Headphones className="w-4 h-4" />
              <span>{showAudioPlayer ? 'Hide Audio Player' : 'Listen to this story'}</span>
              {!showAudioPlayer && <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
        {showSettings && (
          <div className="px-4 lg:px-8 py-4 border-t border-warm-100 dark:border-warm-800 animate-slide-up max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-warm-700 dark:text-warm-300">Theme</span>
              <div className="flex gap-1">
                {themes.map(({ id: tid, label, icon: Icon }) => (
                  <button key={tid} onClick={() => setTheme(tid)} className={cn('p-2 rounded-lg transition-all', theme === tid ? 'bg-primary/10 text-primary' : 'text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800')} title={label}>
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-warm-700 dark:text-warm-300">Font Size</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setFontSize(Math.max(14, fontSize - 2))} className="p-1.5 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-lg"><Minus className="w-4 h-4 text-warm-500" /></button>
                <span className="text-sm font-medium w-8 text-center">{fontSize}</span>
                <button onClick={() => setFontSize(Math.min(28, fontSize + 2))} className="p-1.5 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-lg"><Plus className="w-4 h-4 text-warm-500" /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* READ TAB */}
      {activeTab === 'read' && (
        <div ref={contentRef} className={cn('transition-colors duration-300', currentTheme.bg)}>
          {/* Desktop: two-column layout with sidebar */}
          <div className="max-w-7xl mx-auto lg:flex lg:gap-8 lg:px-8">
            {/* Main reading column */}
            <div className="max-w-2xl mx-auto px-4 lg:px-0 lg:mx-0 lg:flex-1 lg:max-w-3xl py-8 pb-28 lg:pb-8">
              {content.coverImage && (
                <div className="rounded-2xl overflow-hidden mb-8 aspect-[2/1] bg-warm-100 dark:bg-warm-800 relative">
                  <FallbackImage
                    src={content.coverImage}
                    alt={content.title}
                    className="object-cover"
                    fallbackClassName="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                    fallbackIcon={BookOpen}
                    fallbackIconClassName="w-12 h-12 text-warm-300 dark:text-warm-500"
                    priority
                    sizes="(max-width: 768px) 100vw, 720px"
                  />
                </div>
              )}
              <div className="flex items-center gap-2 mb-4">
                <Badge variant={content.contentType?.toLowerCase() as any}>{getContentTypeEmoji(content.contentType)} {content.contentType}</Badge>
                {content.membersOnly && (
                  <Badge variant="primary" size="sm" className="bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400">
                    <Lock className="w-3 h-3 mr-0.5" /> Members Only
                  </Badge>
                )}
                <span className="text-xs text-warm-400">{readingTime(wordCount)}</span>
                <span className="text-xs text-warm-400">·</span>
                <span className="text-xs text-warm-400">{wordCount} words</span>
              </div>
              <h1 className={cn('text-3xl lg:text-4xl font-bold mb-6 leading-tight font-serif', currentTheme.text)}>{content.title}</h1>
              <div className="flex items-center gap-2.5 mb-8 pb-8 border-b border-warm-200/30 dark:border-warm-700/30">
                <Link href={`/user/${author.username}`} className="flex-shrink-0"><Avatar src={author.profileImage} name={author.name || 'User'} size="sm" border /></Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/user/${author.username}`} className="font-semibold text-sm text-warm-900 dark:text-warm-100 hover:text-primary transition-colors truncate block">{author.name}</Link>
                  <p className="text-xs text-warm-500">{formatDate(content.createdAt)}</p>
                </div>
                {!isAuthor && (
                  <Button
                    variant={followingAuthor ? 'outline' : 'primary'}
                    size="sm"
                    onClick={handleFollowAuthor}
                    className="flex-shrink-0"
                    icon={followingAuthor ? <UserMinus className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                  >
                    {followingAuthor ? 'Following' : 'Follow'}
                  </Button>
                )}
              </div>
              <div className="relative">
                <div
                  className={cn(
                    'reading-content font-serif',
                    currentTheme.text,
                    readingLocked && 'max-h-[min(420px,70vh)] overflow-hidden'
                  )}
                  style={{ fontSize, lineHeight: 1.8 }}
                >
                  {isHtmlContent(content.body) ? (
                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.body) }} />
                  ) : (
                    content.body?.split('\n').map((p: string, i: number) => (p.trim() ? <p key={i}>{p}</p> : <br key={i} />))
                  )}
                </div>
                {readingLocked && (
                  <div
                    className={cn(
                      'pointer-events-none absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t to-transparent',
                      theme === 'dark' && 'from-[#1A1A2E] via-[#1A1A2E]/75',
                      theme === 'sepia' && 'from-[#F4ECD8] via-[#F4ECD8]/75',
                      theme === 'light' && 'from-[#FAFAF8] via-[#FAFAF8]/75'
                    )}
                    aria-hidden
                  />
                )}
              </div>

              {readingLocked && lockReason === 'login' && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-6 mt-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-warm-900 dark:text-warm-50 text-lg">Sign in to read the full story</h3>
                    <p className="text-sm text-warm-500 mt-1">Use your phone number — quick OTP, same as the Kalaloka app.</p>
                  </div>
                  <Link
                    href={`/login?next=/content/${id}`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white text-sm font-semibold shadow-lg shadow-primary/25"
                  >
                    <Phone className="w-4 h-4" />
                    Sign in or create account
                  </Link>
                </div>
              )}

              {readingLocked && lockReason === 'premium' && isAuthenticated && (
                <div className="rounded-2xl border border-amber-200/80 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-950/30 p-6 mt-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
                    <Crown className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-warm-900 dark:text-warm-50 text-lg">Premium episode</h3>
                    <p className="text-sm text-warm-500 mt-1">Subscribe to unlock this episode and support writers.</p>
                  </div>
                  <Link
                    href="/subscription"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold"
                  >
                    View plans
                  </Link>
                </div>
              )}

              {readingLocked && lockReason === 'members_only' && isAuthenticated && (
                <div className="rounded-2xl border border-violet-200/80 dark:border-violet-800/50 bg-gradient-to-br from-violet-50/80 to-purple-50/60 dark:from-violet-950/30 dark:to-purple-950/20 p-6 mt-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto">
                    <Crown className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-warm-900 dark:text-warm-50 text-lg">Members Only</h3>
                    <p className="text-sm text-warm-500 mt-1">
                      Subscribe to <span className="font-semibold text-warm-700 dark:text-warm-300">{author.name}</span> to read the full content.
                    </p>
                  </div>
                  {content.creatorPriceINR && (
                    <p className="text-2xl font-bold text-violet-700 dark:text-violet-400">
                      {'\u20B9'}{content.creatorPriceINR}<span className="text-sm font-normal text-warm-500">/month</span>
                    </p>
                  )}
                  <button
                    onClick={async () => {
                      try {
                        await creatorApi.subscribe(author.id);
                        toast.success('Subscribed! Reloading content...');
                        loadContent();
                      } catch (e: any) {
                        toast.error(e.response?.data?.message || 'Failed to subscribe. Check your wallet balance.');
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl transition-all"
                  >
                    <Lock className="w-4 h-4" />
                    Subscribe to unlock
                  </button>
                  <p className="text-[11px] text-warm-400">Payment from your wallet balance. 30-day access.</p>
                </div>
              )}

              {/* Coin / Razorpay unlock paywall */}
              {readingLocked && lockReason === 'coin_unlock' && isAuthenticated && (
                <div className="rounded-2xl border border-amber-200/80 dark:border-amber-800/50 bg-gradient-to-br from-amber-50/80 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20 p-6 mt-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-warm-900 dark:text-warm-50 text-lg">Unlock this episode</h3>
                    <p className="text-sm text-warm-500 mt-1">Choose how you want to unlock this content</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {/* Option 1: Coins */}
                    <button
                      onClick={async () => {
                        try {
                          await contentApi.unlock(id as string);
                          toast.success('Unlocked with Points!');
                          loadContent();
                        } catch (e: any) {
                          toast.error(e.response?.data?.message || 'Failed to unlock');
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold shadow-lg shadow-amber-500/20 hover:shadow-xl transition-all"
                    >
                      <Coins className="w-4 h-4" />
                      Unlock with {content.unlockPrice || 0} Points
                    </button>
                    {/* Option 2: Razorpay */}
                    <button
                      onClick={handleUnlockWithRazorpay}
                      disabled={unlockingPay}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all disabled:opacity-60"
                    >
                      <CreditCard className="w-4 h-4" />
                      {unlockingPay ? 'Processing...' : `Pay \u20B9${Math.max(1, Math.ceil((content.unlockPrice || 0) / 10))}`}
                    </button>
                  </div>
                  <p className="text-[11px] text-warm-400">Points are earned from daily reading. Payment goes directly to the author.</p>
                </div>
              )}

              <div className="flex items-center justify-between py-6 mt-8 border-t border-warm-200/30 dark:border-warm-700/30">
                <div className="flex items-center gap-2">
                  <button onClick={handleLike} className={cn('flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl transition-all', liked ? 'bg-primary/10 text-primary' : 'bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-300')}>
                    <Heart className={cn('w-5 h-5', liked && 'fill-primary')} /><span className="text-sm font-medium">{formatNumber(likeCount)}</span>
                  </button>
                  <button onClick={() => setActiveTab('discuss')} className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-700">
                    <MessageCircle className="w-5 h-5" /><span className="text-sm font-medium">{formatNumber(commentCount || content.commentsCount || content._count?.comments || 0)}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleBookmark} className={cn('flex items-center justify-center w-11 h-11 rounded-xl transition-all', bookmarked ? 'bg-primary/10 text-primary' : 'bg-warm-100 dark:bg-warm-800 text-warm-500 dark:text-warm-400 hover:bg-warm-200 dark:hover:bg-warm-700')}>
                    <Bookmark className={cn('w-5 h-5', bookmarked && 'fill-primary')} />
                  </button>
                  {isAuthenticated && user?.id && author.id && user.id !== author.id && (
                    <button
                      type="button"
                      onClick={() => setShowReport(true)}
                      className="flex items-center justify-center w-11 h-11 rounded-xl bg-warm-100 dark:bg-warm-800 text-warm-500 hover:bg-warm-200 dark:hover:bg-warm-700"
                      title="Report"
                    >
                      <Flag className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="py-4">
                <ShareButtons url={shareUrl} title={content.title || 'Kalaloka'} />
              </div>
              {/* Story continuation teaser */}
              {storyTeaser && !readingLocked && (
                <div className="rounded-2xl border border-purple-200/60 dark:border-purple-800/40 bg-gradient-to-br from-purple-50/80 to-indigo-50/50 dark:from-purple-950/30 dark:to-indigo-950/20 p-6 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <h3 className="font-bold text-warm-900 dark:text-warm-50 text-base">What happens next?</h3>
                  </div>
                  <p className="text-sm text-warm-700 dark:text-warm-300 leading-relaxed italic mb-4">
                    &ldquo;{storyTeaser}&rdquo;
                  </p>
                  {nextEpisodeId && (
                    <Link
                      href={`/content/${nextEpisodeId}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-purple-500/20 hover:shadow-xl transition-all"
                    >
                      Read next episode <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              )}

              <AdSenseSlot className="mb-6" />
              {!isAuthor && (
                <div className="rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 p-6 text-center">
                  <p className="text-sm text-warm-600 dark:text-warm-400 mb-3">Enjoyed this? Show your appreciation!</p>
                  <div className="flex justify-center gap-3">
                    <Button variant="outline" size="sm" icon={<Gem className="w-4 h-4" />} onClick={openGiftModal}>Send a Gem</Button>
                    <Link href={`/rate?authorId=${author.id}`}><Button variant="outline" size="sm" icon={<Star className="w-4 h-4" />}>Rate Author</Button></Link>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop right sidebar */}
            <aside className="hidden lg:block w-80 xl:w-96 flex-shrink-0 py-8">
              <div className="sticky top-16 space-y-6">
                {/* About Author card */}
                <div className="bg-white dark:bg-warm-900 rounded-2xl p-5 border border-warm-100 dark:border-warm-800">
                  <h3 className="text-sm font-semibold text-warm-900 dark:text-warm-100 mb-4">About the Author</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <Link href={`/user/${author.username}`}>
                      <Avatar src={author.profileImage} name={author.name || 'User'} size="lg" border />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/user/${author.username}`} className="font-semibold text-warm-900 dark:text-warm-100 hover:text-primary transition-colors block truncate">{author.name}</Link>
                      <p className="text-xs text-warm-500">@{author.username}</p>
                    </div>
                  </div>
                  {author.bio && <p className="text-sm text-warm-600 dark:text-warm-400 mb-4 line-clamp-3">{author.bio}</p>}
                  <div className="flex items-center gap-4 mb-4 text-center">
                    <div className="flex-1">
                      <p className="text-lg font-bold text-warm-900 dark:text-warm-50">{formatNumber(author.followersCount || 0)}</p>
                      <p className="text-[10px] text-warm-500">Followers</p>
                    </div>
                    <div className="w-px h-8 bg-warm-100 dark:bg-warm-800" />
                    <div className="flex-1">
                      <p className="text-lg font-bold text-warm-900 dark:text-warm-50">{formatNumber(author.contentCount || 0)}</p>
                      <p className="text-[10px] text-warm-500">Stories</p>
                    </div>
                  </div>
                  <Link href={`/user/${author.username}`} className="block">
                    <Button variant="primary" size="sm" className="w-full">View Profile</Button>
                  </Link>
                </div>

                {/* Content stats mini card */}
                <div className="bg-white dark:bg-warm-900 rounded-2xl p-5 border border-warm-100 dark:border-warm-800">
                  <h3 className="text-sm font-semibold text-warm-900 dark:text-warm-100 mb-3">Stats</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Eye, label: 'Views', value: content.viewsCount || content.viewCount || 0 },
                      { icon: Heart, label: 'Likes', value: likeCount },
                      { icon: MessageCircle, label: 'Comments', value: commentCount || content.commentsCount || content._count?.comments || 0 },
                      { icon: Clock, label: 'Read Time', value: readingTime(wordCount) },
                      ...(authorRating && authorRating.count > 0 ? [{ icon: Star, label: `Rating (${authorRating.count})`, value: authorRating.avg.toFixed(1) }] : []),
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-2.5 py-1.5">
                        <div className="w-8 h-8 rounded-lg bg-warm-50 dark:bg-warm-800/60 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-3.5 h-3.5 text-warm-400 dark:text-warm-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-warm-900 dark:text-warm-50">{typeof value === 'number' ? formatNumber(value) : value}</p>
                          <p className="text-[10px] text-warm-500">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hashtags */}
                {content.hashtags?.length > 0 && (
                  <div className="bg-white dark:bg-warm-900 rounded-2xl p-5 border border-warm-100 dark:border-warm-800">
                    <h3 className="text-sm font-semibold text-warm-900 dark:text-warm-100 mb-3">Tags</h3>
                    <div className="flex gap-1.5 flex-wrap">
                      {content.hashtags.map((h: any) => (
                        <Link key={h.id || h} href={`/hashtag/${h.tag || h.hashtag?.tag || h}`}>
                          <Badge variant="primary" size="sm">#{h.tag || h.hashtag?.tag || h}</Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Stories */}
                {related.length > 0 && (
                  <div className="bg-white dark:bg-warm-900 rounded-2xl p-5 border border-warm-100 dark:border-warm-800">
                    <h3 className="text-sm font-semibold text-warm-900 dark:text-warm-100 mb-4">Related Stories</h3>
                    <div className="space-y-3">
                      {related.map((story) => (
                        <Link key={story.id} href={`/content/${story.id}`} className="flex items-center gap-3 group">
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-warm-100 dark:bg-warm-800">
                            {story.coverImage ? (
                              <FallbackImage src={story.coverImage} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" fallbackClassName="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center" fallbackIcon={BookOpen} fallbackIconClassName="w-5 h-5 text-warm-300 dark:text-warm-500" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"><BookOpen className="w-5 h-5 text-warm-300" /></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-warm-900 dark:text-warm-100 truncate group-hover:text-primary transition-colors">{story.title}</p>
                            <p className="text-xs text-warm-500">{story.author?.name}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-warm-300 flex-shrink-0 group-hover:text-primary transition-colors" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* ═══ COMMENTS SECTION (always visible below story) ═══ */}
      <div className="max-w-2xl mx-auto px-4 lg:px-6 pb-24 lg:pb-8">
            {/* ═══ COMMENTS ═══ */}
            <div className="mt-10 pt-8 border-t border-warm-200/50 dark:border-warm-700/50">
              <h3 className="text-lg font-bold text-warm-900 dark:text-warm-50 mb-5 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" /> Comments ({comments.length})
              </h3>
              <div className="mb-6">
                {replyingTo && (
                  <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-primary/5 rounded-lg">
                    <span className="text-xs text-primary">Replying to {replyingTo.user?.name}</span>
                    <button onClick={() => setReplyingTo(null)} className="text-xs text-warm-400 hover:text-warm-600">Cancel</button>
                  </div>
                )}
                {isAuthenticated ? (
                  <div className="flex gap-3 items-start">
                    <Avatar src={user?.profileImage} name={user?.name || 'You'} size="sm" className="mt-1.5" />
                    <div className="flex-1 flex items-center gap-2 bg-warm-50 dark:bg-warm-900 border border-warm-200 dark:border-warm-800 rounded-2xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                      <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleComment()} placeholder="Write a comment..." className="flex-1 bg-transparent text-sm outline-none text-warm-900 dark:text-warm-100 placeholder:text-warm-400 min-w-0" />
                      <button onClick={handleComment} disabled={!commentText.trim()} className={cn('p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center -mr-1', commentText.trim() ? 'text-primary hover:bg-primary/10' : 'text-warm-300')}>
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link href={`/login?next=/content/${id}`} className="block text-center py-4 bg-warm-50 dark:bg-warm-900 rounded-2xl border border-warm-200 dark:border-warm-800 text-sm text-primary font-medium hover:bg-primary/5 transition-colors">
                    Sign in to comment
                  </Link>
                )}
              </div>
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-8"><p className="text-sm text-warm-400">No comments yet. Be the first!</p></div>
                ) : (() => {
                  const topLevel = comments.filter((c: any) => !c.parentId);
                  const repliesMap: Record<string, any[]> = {};
                  comments.forEach((c: any) => {
                    if (c.parentId) {
                      if (!repliesMap[c.parentId]) repliesMap[c.parentId] = [];
                      repliesMap[c.parentId].push(c);
                    }
                  });
                  return topLevel.map((comment: any) => (
                    <div key={comment.id}>
                      <div className="flex gap-3">
                        <Link href={`/user/${comment.user?.username}`}><Avatar src={comment.user?.profileImage} name={comment.user?.name || 'User'} size="sm" /></Link>
                        <div className="flex-1">
                          <div className="bg-warm-50 dark:bg-warm-900 rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-warm-900 dark:text-warm-100">{comment.user?.name}</span>
                              <span className="text-[10px] text-warm-400">{formatDate(comment.createdAt)}</span>
                            </div>
                            <p className="text-sm text-warm-700 dark:text-warm-300">{comment.body || comment.text}</p>
                          </div>
                          <div className="flex items-center gap-3 mt-1 ml-2">
                            <button onClick={() => setReplyingTo(comment)} className="text-xs text-warm-400 dark:text-warm-500 hover:text-primary">Reply</button>
                          </div>
                        </div>
                      </div>
                      {repliesMap[comment.id]?.map((reply: any) => (
                        <div key={reply.id} className="flex gap-3 ml-8 sm:ml-10 mt-3">
                          <Link href={`/user/${reply.user?.username}`}><Avatar src={reply.user?.profileImage} name={reply.user?.name || 'User'} size="xs" /></Link>
                          <div className="flex-1">
                            <div className="bg-warm-100/60 dark:bg-warm-800/60 rounded-2xl px-4 py-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-warm-900 dark:text-warm-100">{reply.user?.name}</span>
                                <span className="text-[10px] text-warm-400">{formatDate(reply.createdAt)}</span>
                              </div>
                              <p className="text-sm text-warm-700 dark:text-warm-300">{reply.body || reply.text}</p>
                            </div>
                            <div className="flex items-center gap-3 mt-1 ml-2">
                              <button onClick={() => setReplyingTo(reply)} className="text-xs text-warm-400 dark:text-warm-500 hover:text-primary">Reply</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            </div>
      </div>

      {/* DETAILS SECTION — disabled, info shown in sidebar */}
      {false && (
        <div className="max-w-7xl mx-auto lg:flex lg:gap-8 lg:px-8">
          <div className="max-w-2xl mx-auto px-4 lg:px-0 lg:mx-0 lg:flex-1 lg:max-w-3xl py-6 pb-28 lg:pb-6 space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Eye, label: 'Views', value: content.viewsCount || content.viewCount || 0 },
                { icon: Heart, label: 'Likes', value: likeCount },
                { icon: MessageCircle, label: 'Comments', value: commentCount || content.commentsCount || content._count?.comments || 0 },
                { icon: Bookmark, label: 'Saves', value: content.bookmarksCount || 0 },
                { icon: Clock, label: 'Read Time', value: readingTime(wordCount) },
                { icon: Type, label: 'Words', value: wordCount },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white dark:bg-warm-900 rounded-xl p-4 border border-warm-100 dark:border-warm-800 text-center">
                  <div className="w-8 h-8 rounded-lg bg-warm-50 dark:bg-warm-800/60 flex items-center justify-center mx-auto mb-1.5">
                    <Icon className="w-3.5 h-3.5 text-warm-400 dark:text-warm-500" />
                  </div>
                  <p className="text-lg font-bold text-warm-900 dark:text-warm-50">{typeof value === 'number' ? formatNumber(value) : value}</p>
                  <p className="text-[10px] text-warm-500">{label}</p>
                </div>
              ))}
            </div>
            {/* Author card - visible on mobile for details tab (desktop has sidebar) */}
            <div className="lg:hidden bg-white dark:bg-warm-900 rounded-2xl p-5 border border-warm-100 dark:border-warm-800">
              <h3 className="text-sm font-semibold text-warm-900 dark:text-warm-100 mb-3">About the Author</h3>
              <div className="flex items-center gap-3">
                <Avatar src={author.profileImage} name={author.name} size="lg" border />
                <div className="flex-1">
                  <p className="font-semibold text-warm-900 dark:text-warm-100">{author.name}</p>
                  <p className="text-xs text-warm-500">@{author.username}</p>
                  {author.bio && <p className="text-xs text-warm-500 mt-1 line-clamp-2">{author.bio}</p>}
                </div>
                <Link href={`/user/${author.username}`}><Button variant="primary" size="sm">View Profile</Button></Link>
              </div>
            </div>
            {content.hashtags?.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {content.hashtags.map((h: any) => (
                  <Link key={h.id || h} href={`/hashtag/${h.tag || h.hashtag?.tag || h}`}>
                    <Badge variant="primary" size="sm">#{h.tag || h.hashtag?.tag || h}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
          {/* Desktop sidebar for details tab */}
          <aside className="hidden lg:block w-80 xl:w-96 flex-shrink-0 py-6">
            <div className="sticky top-16 space-y-6">
              <div className="bg-white dark:bg-warm-900 rounded-2xl p-5 border border-warm-100 dark:border-warm-800">
                <h3 className="text-sm font-semibold text-warm-900 dark:text-warm-100 mb-4">About the Author</h3>
                <div className="flex items-center gap-3 mb-4">
                  <Link href={`/user/${author.username}`}><Avatar src={author.profileImage} name={author.name || 'User'} size="lg" border /></Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/user/${author.username}`} className="font-semibold text-warm-900 dark:text-warm-100 hover:text-primary transition-colors block truncate">{author.name}</Link>
                    <p className="text-xs text-warm-500">@{author.username}</p>
                  </div>
                </div>
                {author.bio && <p className="text-sm text-warm-600 dark:text-warm-400 mb-4 line-clamp-3">{author.bio}</p>}
                <div className="flex items-center gap-4 mb-4 text-center">
                  <div className="flex-1">
                    <p className="text-lg font-bold text-warm-900 dark:text-warm-50">{formatNumber(author.followersCount || 0)}</p>
                    <p className="text-[10px] text-warm-500">Followers</p>
                  </div>
                  <div className="w-px h-8 bg-warm-100 dark:bg-warm-800" />
                  <div className="flex-1">
                    <p className="text-lg font-bold text-warm-900 dark:text-warm-50">{formatNumber(author.contentCount || 0)}</p>
                    <p className="text-[10px] text-warm-500">Stories</p>
                  </div>
                </div>
                <Link href={`/user/${author.username}`} className="block"><Button variant="primary" size="sm" className="w-full">View Profile</Button></Link>
              </div>
              {related.length > 0 && (
                <div className="bg-white dark:bg-warm-900 rounded-2xl p-5 border border-warm-100 dark:border-warm-800">
                  <h3 className="text-sm font-semibold text-warm-900 dark:text-warm-100 mb-4">Related Stories</h3>
                  <div className="space-y-3">
                    {related.map((story) => (
                      <Link key={story.id} href={`/content/${story.id}`} className="flex items-center gap-3 group">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-warm-100 dark:bg-warm-800">
                          {story.coverImage ? (
                            <FallbackImage src={story.coverImage} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" fallbackClassName="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center" fallbackIcon={BookOpen} fallbackIconClassName="w-5 h-5 text-warm-300 dark:text-warm-500" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"><BookOpen className="w-5 h-5 text-warm-300" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-warm-900 dark:text-warm-100 truncate group-hover:text-primary transition-colors">{story.title}</p>
                          <p className="text-xs text-warm-500">{story.author?.name}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-warm-300 flex-shrink-0 group-hover:text-primary transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Inline Gift Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowGiftModal(false)}>
          <div
            className="bg-white dark:bg-warm-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl border-t sm:border border-warm-200 dark:border-warm-700 shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-warm-100 dark:border-warm-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Gem className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-warm-900 dark:text-warm-50">Send a Gem <span className="inline-block">&#x1F48E;</span></h2>
                  <p className="text-xs text-warm-500">to {author.name}</p>
                </div>
              </div>
              <button onClick={() => setShowGiftModal(false)} className="p-1.5 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-800 text-warm-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success state */}
            {giftSuccess ? (
              <div className="px-5 py-10 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-warm-900 dark:text-warm-50">Gem sent! &#x2728;</p>
                  <p className="text-sm text-warm-500 mt-1">
                    {author.name} received your <span className="font-semibold">{giftSuccess}</span>
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setShowGiftModal(false)}>
                  Close
                </Button>
              </div>
            ) : (
              <>
                {/* Point balance */}
                <div className="px-5 py-3 bg-warm-50 dark:bg-warm-800/50 flex items-center justify-between">
                  <span className="text-xs text-warm-500">Your balance</span>
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-warm-900 dark:text-warm-100">{user?.coins ?? 0} Points</span>
                  </div>
                </div>

                {/* Gift grid */}
                <div className="px-5 py-4 max-h-[50vh] overflow-y-auto">
                  {loadingGifts ? (
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="skeleton h-24 rounded-xl" />
                      ))}
                    </div>
                  ) : giftCatalog.length === 0 ? (
                    <p className="text-sm text-warm-500 text-center py-8">No gems available yet.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {giftCatalog.map((gift) => {
                        const affordable = gift.coinPrice <= (user?.coins ?? 0);
                        return (
                          <button
                            key={gift.id}
                            type="button"
                            disabled={!affordable}
                            onClick={() => setSelectedGiftId(selectedGiftId === gift.id ? null : gift.id)}
                            className={cn(
                              'flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all text-center',
                              selectedGiftId === gift.id
                                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/15 scale-[1.05]'
                                : affordable
                                  ? 'border-warm-100 dark:border-warm-800 bg-white dark:bg-warm-900 hover:border-primary/30 hover:shadow-md hover:scale-[1.02]'
                                  : 'border-warm-100 dark:border-warm-800 bg-warm-50 dark:bg-warm-950 opacity-40 cursor-not-allowed'
                            )}
                          >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                              {gift.iconEmoji ? (
                                <span className="text-2xl">{gift.iconEmoji}</span>
                              ) : gift.imageUrl ? (
                                <Image src={gift.imageUrl} alt="" width={32} height={32} className="w-8 h-8 object-contain" />
                              ) : (
                                <Gem className="w-6 h-6 text-amber-500" />
                              )}
                            </div>
                            <p className="text-[11px] font-semibold text-warm-800 dark:text-warm-200 truncate w-full">{gift.name}</p>
                            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <Coins className="w-3 h-3" />
                              <span className="text-[10px] font-bold">{gift.coinPrice}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Send button */}
                <div className="px-5 py-4 border-t border-warm-100 dark:border-warm-800">
                  {selectedGiftId && (() => {
                    const gift = giftCatalog.find((g) => g.id === selectedGiftId);
                    if (!gift) return null;
                    return (
                      <div className="flex items-center justify-between mb-3 text-xs text-warm-500">
                        <span>Sending: <span className="font-semibold text-warm-800 dark:text-warm-200">{gift.iconEmoji} {gift.name}</span></span>
                        <span>Cost: <span className="font-bold text-warm-800 dark:text-warm-200">{gift.coinPrice} Points</span></span>
                      </div>
                    );
                  })()}
                  <Button
                    className="w-full"
                    size="lg"
                    loading={sendingGift}
                    disabled={!selectedGiftId}
                    icon={<Send className="w-4 h-4" />}
                    onClick={sendGift}
                  >
                    {selectedGiftId ? 'Send Gem' : 'Select a gem'}
                  </Button>
                  <p className="text-[10px] text-warm-400 text-center mt-2">
                    <Link href="/wallet" className="text-primary hover:underline">Earn more Points</Link> from daily reading
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ReportContentModal contentId={id as string} open={showReport} onClose={() => setShowReport(false)} />

      {/* Sticky Audio Player */}
      {showAudioPlayer && content.audioUrl && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:ml-[260px] bg-white/95 dark:bg-warm-950/95 backdrop-blur-xl border-t border-warm-200 dark:border-warm-800 shadow-2xl">
          <audio
            ref={audioRef}
            src={content.audioUrl}
            preload="none"
            onTimeUpdate={() => {
              if (audioRef.current) {
                setAudioProgress(audioRef.current.currentTime);
                setAudioDuration(audioRef.current.duration || 0);
              }
            }}
            onEnded={() => setAudioPlaying(false)}
            onLoadedMetadata={() => {
              if (audioRef.current) setAudioDuration(audioRef.current.duration);
            }}
          />
          {/* Progress bar */}
          <div
            className="h-1 bg-warm-100 dark:bg-warm-800 cursor-pointer"
            onClick={(e) => {
              if (!audioRef.current || !audioDuration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              audioRef.current.currentTime = pct * audioDuration;
            }}
          >
            <div
              className="h-full gradient-primary transition-all duration-150"
              style={{ width: audioDuration ? `${(audioProgress / audioDuration) * 100}%` : '0%' }}
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (!audioRef.current) return;
                  if (audioPlaying) {
                    audioRef.current.pause();
                    setAudioPlaying(false);
                  } else {
                    audioRef.current.play().catch(() => {});
                    setAudioPlaying(true);
                  }
                }}
                className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/25 hover:scale-105 transition-transform"
              >
                {audioPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <div className="min-w-0">
                <p className="text-sm font-medium text-warm-900 dark:text-warm-100 truncate max-w-[200px] sm:max-w-xs">
                  {content.title}
                </p>
                <p className="text-[10px] text-warm-400">
                  {formatAudioTime(audioProgress)} / {formatAudioTime(audioDuration)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Speed control */}
              <button
                onClick={() => {
                  const speeds = [1, 1.25, 1.5, 2];
                  const nextIdx = (speeds.indexOf(audioSpeed) + 1) % speeds.length;
                  const newSpeed = speeds[nextIdx];
                  setAudioSpeed(newSpeed);
                  if (audioRef.current) audioRef.current.playbackRate = newSpeed;
                }}
                className="px-2 py-1 rounded-lg text-xs font-bold text-warm-600 dark:text-warm-400 bg-warm-100 dark:bg-warm-800 hover:bg-warm-200 dark:hover:bg-warm-700 transition-colors"
              >
                {audioSpeed}x
              </button>
              <button
                onClick={() => {
                  setShowAudioPlayer(false);
                  if (audioRef.current) {
                    audioRef.current.pause();
                    setAudioPlaying(false);
                  }
                }}
                className="p-1.5 rounded-lg text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatAudioTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
