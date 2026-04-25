'use client';

import { useEffect, useState, useCallback } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import {
  Bell, Heart, MessageCircle, UserPlus, Star, Gift, Trophy,
  BookOpen, Coins, Check, Radio, Library, TrendingUp, Timer,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { notificationApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';
import toast from 'react-hot-toast';

const iconMap: Record<string, { icon: typeof Heart; color: string }> = {
  new_like: { icon: Heart, color: 'bg-rose-100 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400' },
  new_message: { icon: MessageCircle, color: 'bg-blue-100 text-blue-500 dark:bg-blue-950/40 dark:text-blue-400' },
  new_follower: { icon: UserPlus, color: 'bg-violet-100 text-violet-500 dark:bg-violet-950/40 dark:text-violet-400' },
  new_gift: { icon: Gift, color: 'bg-purple-100 text-purple-500 dark:bg-purple-950/40 dark:text-purple-400' },
  new_support: { icon: Coins, color: 'bg-amber-100 text-amber-500 dark:bg-amber-950/40 dark:text-amber-400' },
  referral_success: { icon: Star, color: 'bg-emerald-100 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400' },
  new_content: { icon: BookOpen, color: 'bg-orange-100 text-orange-500 dark:bg-orange-950/40 dark:text-orange-400' },
  live_room: { icon: Radio, color: 'bg-red-100 text-red-500 dark:bg-red-950/40 dark:text-red-400' },
  new_episode: { icon: Library, color: 'bg-violet-100 text-violet-500 dark:bg-violet-950/40 dark:text-violet-400' },
  trending: { icon: TrendingUp, color: 'bg-emerald-100 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400' },
  competition_ending: { icon: Timer, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400' },
};

type FilterType = 'all' | string;

export default function NotificationsPage() {
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await notificationApi.getAll({ page: 1, limit: 80 });
      const list = data?.data || data || [];
      setNotifications(Array.isArray(list) ? list : []);
    } catch {
      setNotifications([]);
      toast.error('Could not load notifications');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      toast.error('Failed to mark read');
    }
  };

  const filtered =
    filter === 'all' ? notifications : notifications.filter((n) => n.type === filter);

  const grouped = filtered.reduce(
    (acc, n) => {
      const day = formatDate(n.createdAt);
      if (!acc[day]) acc[day] = [];
      acc[day].push(n);
      return acc;
    },
    {} as Record<string, any[]>
  );

  const filters: { key: FilterType; label: string; icon: typeof Bell }[] = [
    { key: 'all', label: 'All', icon: Bell },
    { key: 'new_content', label: 'New Posts', icon: BookOpen },
    { key: 'live_room', label: 'Live', icon: Radio },
    { key: 'new_episode', label: 'Episodes', icon: Library },
    { key: 'new_like', label: 'Likes', icon: Heart },
    { key: 'new_follower', label: 'Follows', icon: UserPlus },
    { key: 'new_message', label: 'Messages', icon: MessageCircle },
    { key: 'new_gift', label: 'Gifts', icon: Gift },
  ];

  if (!isAuthenticated) {
    return (
      <div className="px-4 lg:px-8 py-16 max-w-lg mx-auto text-center">
        <EmptyState icon={Bell} title="See your notifications" description="Likes, comments, and follows show up here." />
        <Link href="/login?next=/notifications" className="mt-6 inline-block text-primary font-semibold hover:underline">
          Sign in to view
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50">Notifications</h1>
            {unreadCount > 0 && <p className="text-xs text-warm-500">{unreadCount} unread</p>}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} icon={<Check className="w-3.5 h-3.5" />}>
            Mark all read
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              filter === key
                ? 'bg-primary text-white shadow-sm shadow-primary/20'
                : 'bg-white dark:bg-warm-900 text-warm-600 dark:text-warm-400 border border-warm-200 dark:border-warm-800 hover:border-primary/30'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([groupName, items]) => (
            <div key={groupName}>
              <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide mb-3">{groupName}</p>
              <div className="space-y-2">
                {(items as any[]).map((n: any) => {
                  const cfg = iconMap[n.type] || { icon: Bell, color: 'bg-warm-100 text-warm-500' };
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        'flex gap-3 p-4 rounded-2xl border transition-colors',
                        n.isRead
                          ? 'bg-white dark:bg-warm-900 border-warm-100 dark:border-warm-800'
                          : 'bg-primary/5 border-primary/15 dark:bg-primary/10'
                      )}
                    >
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-warm-900 dark:text-warm-50">{n.title}</p>
                        <p className="text-sm text-warm-600 dark:text-warm-400 mt-0.5">{n.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
