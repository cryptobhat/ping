'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { contentApi, seriesApi } from '@/lib/api';
import { ContentCard } from '@/components/content/ContentCard';
import { BookCard } from '@/components/content/BookCard';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ContentCardSkeleton } from '@/components/ui/Skeleton';
import {
  Settings, Wallet, Star, Edit, BookOpen, Feather, FileText,
  Layers, FileEdit, MapPin, Calendar, Link2, CheckCircle, Users,
  Bell, Trophy, Target, LogOut, MoreHorizontal, Trash2, EyeOff, Radio,
} from 'lucide-react';
import { cn, formatNumber, formatDate } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

const contentTabs = [
  { id: 'stories', label: 'Stories', icon: BookOpen, type: 'STORY' },
  { id: 'poems', label: 'Poems', icon: Feather, type: 'POEM' },
  { id: 'articles', label: 'Articles', icon: FileText, type: 'ARTICLE' },
  { id: 'series', label: 'Series', icon: Layers, type: '' },
  { id: 'drafts', label: 'Drafts', icon: FileEdit, type: '' },
];

export default function ProfilePage() {
  const { user, fetchUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('stories');
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    setContent([]);
    setPage(1);
    loadContent(1);
  }, [activeTab, user?.id]);

  const loadContent = async (p: number) => {
    setLoading(p === 1);

    if (!user?.id) {
      setContent([]);
      setLoading(false);
      return;
    }

    try {
      if (activeTab === 'series') {
        const { data } = await seriesApi.list({ authorId: user.id, page: p, limit: 15 });
        const items = data?.data || data || [];
        setContent(p === 1 ? items : (prev) => [...prev, ...items]);
      } else if (activeTab === 'drafts') {
        const { data } = await contentApi.getDrafts({ page: p, limit: 15 });
        const items = data?.data || data || [];
        setContent(p === 1 ? items : (prev) => [...prev, ...items]);
      } else {
        const tab = contentTabs.find((t) => t.id === activeTab);
        const { data } = await contentApi.getFeed({ authorId: user.id, contentType: tab?.type, page: p, limit: 15 });
        const items = data?.data || data || [];
        setContent(p === 1 ? items : (prev) => [...prev, ...items]);
      }
    } catch {
      setContent([]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="px-4 py-16 max-w-lg mx-auto text-center">
        <EmptyState icon={BookOpen} title="Your profile" description="Sign in to see your stories, series, and drafts." />
        <Link href="/login?next=/profile" className="mt-6 inline-block text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  const profile = user;

  return (
    <div className="pb-8">
      {/* Cover Image - full width */}
      <div className="h-32 sm:h-44 lg:h-56 xl:h-64 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/10 dark:from-primary/10 dark:via-accent/5 dark:to-primary/5 relative overflow-hidden">
        {profile.coverImage && (
          <img
            src={profile.coverImage}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Profile Content Container - centered and max-width */}
      <div className="max-w-5xl mx-auto px-4 lg:px-8">
        {/* Profile Header */}
        <div className="-mt-12 sm:-mt-16 lg:-mt-20 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
            {/* Avatar */}
            <Avatar
              src={profile.profileImage}
              name={profile.name}
              size="xl"
              border
              className="ring-4 ring-white dark:ring-warm-950 w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32"
            />

            {/* Name and Actions */}
            <div className="flex-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-1">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl lg:text-3xl font-bold text-warm-900 dark:text-warm-50">
                    {profile.name}
                  </h1>
                  {profile.isVerified && <CheckCircle className="w-5 h-5 text-primary fill-primary/20" />}
                  {profile.isPremium && <Badge variant="warning" size="sm">Premium</Badge>}
                </div>
                <p className="text-sm text-warm-500 mt-0.5">@{profile.username}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Link href="/settings/edit-profile">
                  <Button variant="outline" size="sm" icon={<Edit className="w-3.5 h-3.5" />}>
                    Edit Profile
                  </Button>
                </Link>
                <Link href="/wallet">
                  <Button variant="secondary" size="sm" icon={<Wallet className="w-3.5 h-3.5" />}>
                    Wallet
                  </Button>
                </Link>
                {!profile.isPremium && (
                  <Link href="/subscription">
                    <Button variant="primary" size="sm" icon={<Star className="w-3.5 h-3.5" />}>
                      Premium
                    </Button>
                  </Link>
                )}
              </div>

              {/* Mobile Quick Links (visible only on mobile — replaces sidebar) */}
              <div className="lg:hidden mt-4 grid grid-cols-5 gap-1.5">
                {([
                  { href: '/settings', Icon: Settings, label: 'Settings', color: 'text-warm-600 dark:text-warm-400' },
                  { href: '/notifications', Icon: Bell, label: 'Alerts', color: 'text-primary' },
                  { href: '/live', Icon: Radio, label: 'Live', color: 'text-red-500' },
                  { href: '/leaderboard', Icon: Trophy, label: 'Leaders', color: 'text-amber-500' },
                  { href: '/competitions', Icon: Target, label: 'Contests', color: 'text-emerald-500' },
                ] as const).map(({ href, Icon, label, color }) => (
                  <Link key={href} href={href} className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-warm-50 dark:bg-warm-900 border border-warm-100 dark:border-warm-800 hover:border-primary/30 transition-colors">
                    <Icon className={`w-5 h-5 ${color}`} />
                    <span className="text-[10px] font-medium text-warm-600 dark:text-warm-400">{label}</span>
                  </Link>
                ))}
              </div>

            </div>
          </div>

          {/* Bio and Meta */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              {profile.bio && (
                <p className="text-sm text-warm-600 dark:text-warm-400 leading-relaxed mb-4">
                  {profile.bio}
                </p>
              )}
              {/* Meta info row */}
              <div className="flex items-center gap-4 flex-wrap text-xs text-warm-500">
                {(profile as any).location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {(profile as any).location}
                  </span>
                )}
                {(profile as any).joinedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {formatDate((profile as any).joinedAt)}
                  </span>
                )}
                {(profile as any).website && (
                  <a
                    href={`https://${(profile as any).website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    {(profile as any).website}
                  </a>
                )}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 p-5">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-warm-900 dark:text-warm-50">
                    {formatNumber(profile.contentCount || 0)}
                  </p>
                  <p className="text-xs text-warm-500 mt-0.5">Posts</p>
                </div>
                <Link href="/profile/followers" className="hover:opacity-70 transition-opacity">
                  <p className="text-2xl font-bold text-warm-900 dark:text-warm-50">
                    {formatNumber(profile.followersCount || 0)}
                  </p>
                  <p className="text-xs text-warm-500 mt-0.5">Followers</p>
                </Link>
                <Link href="/profile/following" className="hover:opacity-70 transition-opacity">
                  <p className="text-2xl font-bold text-warm-900 dark:text-warm-50">
                    {formatNumber(profile.followingCount || 0)}
                  </p>
                  <p className="text-xs text-warm-500 mt-0.5">Following</p>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="flex gap-0.5 overflow-x-auto scrollbar-hide border-b border-warm-100 dark:border-warm-800 mb-6 -mx-4 px-4 lg:mx-0 lg:px-0">
          {contentTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-4 sm:px-5 py-3 min-h-[44px] text-sm font-medium whitespace-nowrap border-b-2 transition-all flex-shrink-0',
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-warm-500 hover:text-warm-700 dark:hover:text-warm-300'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <ContentCardSkeleton key={i} />)}
          </div>
        ) : content.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={`No ${activeTab} yet`}
            description={activeTab === 'drafts' ? 'Your drafts will appear here' : 'Start writing to see your work here'}
            actionLabel="Start Writing"
            onAction={() => window.location.href = '/create'}
          />
        ) : activeTab === 'series' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {content.map((s: any) => <BookCard key={s.id} item={s} type="series" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {content.map((item: any) => (
              <div key={item.id} className="relative">
                <ContentCard content={item} variant="grid" />
                <ProfileContentMenu
                  contentId={item.id}
                  status={item.status}
                  onDelete={() => setContent((prev) => prev.filter((c: any) => c.id !== item.id))}
                  onUnpublish={() => {
                    if (activeTab !== 'drafts') {
                      setContent((prev) => prev.filter((c: any) => c.id !== item.id));
                    }
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** 3-dot menu for author's own content on profile page */
function ProfileContentMenu({
  contentId,
  status,
  onDelete,
  onUnpublish,
}: {
  contentId: string;
  status?: string;
  onDelete: () => void;
  onUnpublish: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<'delete' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(null);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleEdit = () => {
    setOpen(false);
    window.location.href = `/create?edit=${contentId}`;
  };

  const handleUnpublish = async () => {
    setOpen(false);
    try {
      await contentApi.update(contentId, { status: 'DRAFT' });
      toast.success('Moved to drafts');
      onUnpublish();
    } catch {
      toast.error('Could not unpublish');
    }
  };

  const handleDelete = async () => {
    if (confirming !== 'delete') {
      setConfirming('delete');
      return;
    }
    setOpen(false);
    setConfirming(null);
    try {
      await contentApi.delete(contentId);
      toast.success('Deleted');
      onDelete();
    } catch {
      toast.error('Could not delete');
    }
  };

  return (
    <div ref={menuRef} className="absolute top-2 right-2 z-20">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
          setConfirming(null);
        }}
        className="w-8 h-8 rounded-full bg-white/90 dark:bg-warm-900/90 backdrop-blur-sm border border-warm-200 dark:border-warm-700 flex items-center justify-center hover:bg-warm-100 dark:hover:bg-warm-800 transition-colors shadow-sm"
      >
        <MoreHorizontal className="w-4 h-4 text-warm-600 dark:text-warm-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 w-44 rounded-xl bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 shadow-xl py-1 z-30">
          <button
            onClick={handleEdit}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-warm-700 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          {status !== 'DRAFT' && (
            <button
              onClick={handleUnpublish}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-warm-700 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
            >
              <EyeOff className="w-4 h-4" />
              Unpublish (draft)
            </button>
          )}
          <button
            onClick={handleDelete}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors',
              confirming === 'delete'
                ? 'text-red-600 bg-red-50 dark:bg-red-950/20 font-medium'
                : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
            )}
          >
            <Trash2 className="w-4 h-4" />
            {confirming === 'delete' ? 'Confirm delete?' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  );
}
