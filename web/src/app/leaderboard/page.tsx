'use client';

import { useEffect, useState } from 'react';
import { leaderboardApi, followApi } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
  Trophy, Crown, Medal, Star, Eye, Users, FileText, IndianRupee,
  TrendingUp, Sparkles, Flame, ArrowRight,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import Link from 'next/link';
import { getReadingLang } from '@/lib/reading-lang';
import { useAuthStore } from '@/store/auth';

type Tab = 'today' | 'week' | 'month' | 'alltime' | 'earners' | 'rising';

const tabs: { key: Tab; label: string; icon: typeof Trophy }[] = [
  { key: 'today', label: "Today", icon: Flame },
  { key: 'week', label: 'Week', icon: TrendingUp },
  { key: 'month', label: 'Month', icon: Crown },
  { key: 'alltime', label: 'All Time', icon: Trophy },
  { key: 'earners', label: 'Earners', icon: IndianRupee },
  { key: 'rising', label: 'Rising', icon: Sparkles },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
        <Crown className="w-5 h-5 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg shadow-gray-400/30">
        <Medal className="w-5 h-5 text-white" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center shadow-lg shadow-orange-600/30">
        <Medal className="w-5 h-5 text-white" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-warm-100 dark:bg-warm-800 flex items-center justify-center">
      <span className="text-sm font-bold text-warm-500 dark:text-warm-400">#{rank}</span>
    </div>
  );
}

function LeaderboardRow({
  entry,
  activeTab,
  isFollowing,
  onFollow,
  currentUserId,
}: {
  entry: any;
  activeTab: Tab;
  isFollowing: boolean;
  onFollow: (userId: string) => void;
  currentUserId?: string;
}) {
  const { rank, user, stats } = entry;
  const isTop3 = rank <= 3;
  const isCurrentUser = currentUserId === user.id;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-2xl transition-all duration-200',
        isTop3
          ? 'bg-gradient-to-r from-amber-50/80 via-white to-white dark:from-amber-950/20 dark:via-warm-900 dark:to-warm-900 border border-amber-200/50 dark:border-amber-800/30 shadow-sm hover:shadow-md'
          : 'bg-white dark:bg-warm-900 border border-warm-100 dark:border-warm-800 hover:border-primary/20 hover:shadow-sm',
        isCurrentUser && 'ring-2 ring-primary/20'
      )}
    >
      <RankBadge rank={rank} />

      <Link href={`/user/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0 group">
        <Avatar
          src={user.profileImage}
          name={user.name}
          size={isTop3 ? 'lg' : 'md'}
          border={isTop3}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className={cn(
              'font-semibold truncate group-hover:text-primary transition-colors',
              isTop3 ? 'text-base text-warm-900 dark:text-warm-50' : 'text-sm text-warm-800 dark:text-warm-200'
            )}>
              {user.name}
            </h3>
            {user.isVerified && (
              <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Star className="w-2.5 h-2.5 text-white fill-white" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-warm-500 truncate">@{user.username}</p>
            {stats.joinedDaysAgo && stats.joinedDaysAgo <= 30 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 uppercase">New</span>
            )}
          </div>
        </div>
      </Link>

      {/* Stats */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {activeTab === 'earners' && stats.earnings !== undefined ? (
          <div className="text-right">
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <IndianRupee className="w-4 h-4" />
              {formatNumber(stats.earnings)}
            </p>
            <p className="text-[10px] text-warm-400">earned</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-xs text-warm-500">
            <div className="text-center hidden sm:block">
              <p className="font-semibold text-warm-700 dark:text-warm-300">{formatNumber(stats.views)}</p>
              <p className="text-[10px] text-warm-400">views</p>
            </div>
            <div className="text-center hidden sm:block">
              <p className="font-semibold text-warm-700 dark:text-warm-300">{formatNumber(stats.followers)}</p>
              <p className="text-[10px] text-warm-400">followers</p>
            </div>
            <div className="text-center sm:hidden">
              <p className="font-semibold text-warm-700 dark:text-warm-300 flex items-center gap-0.5">
                <Eye className="w-3 h-3" /> {formatNumber(stats.views)}
              </p>
            </div>
          </div>
        )}

        {/* Follow button */}
        {!isCurrentUser && (
          <button
            onClick={(e) => { e.preventDefault(); onFollow(user.id); }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex-shrink-0',
              isFollowing
                ? 'bg-warm-100 dark:bg-warm-800 text-warm-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30'
                : 'bg-primary text-white hover:bg-primary-dark shadow-sm shadow-primary/20'
            )}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const { user } = useAuthStore();

  const lang = getReadingLang();

  useEffect(() => {
    loadData();
  }, [activeTab, lang]);

  useEffect(() => {
    // Load current user's following list
    if (user) {
      followApi.getFollowing({ limit: 500 }).then((res) => {
        const ids = (res.data?.data || []).map((f: any) => f.followingId || f.id);
        setFollowingSet(new Set(ids));
      }).catch(() => {});
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 20 };
      if (lang) params.language = lang;

      let res;
      switch (activeTab) {
        case 'today':
          res = await leaderboardApi.getTopWriters({ ...params, period: 'today' });
          break;
        case 'week':
          res = await leaderboardApi.getTopWriters({ ...params, period: 'week' });
          break;
        case 'month':
          res = await leaderboardApi.getTopWriters({ ...params, period: 'month' });
          break;
        case 'alltime':
          res = await leaderboardApi.getTopWriters(params);
          break;
        case 'earners':
          res = await leaderboardApi.getTopEarners(params);
          break;
        case 'rising':
          res = await leaderboardApi.getRisingAuthors(params);
          break;
      }
      setData(res?.data?.data || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      if (followingSet.has(userId)) {
        await followApi.unfollow(userId);
        setFollowingSet((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      } else {
        await followApi.follow(userId);
        setFollowingSet((prev) => new Set(prev).add(userId));
      }
    } catch {}
  };

  return (
    <div className="py-4 lg:py-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="px-4 lg:px-0 text-center">
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-warm-900 dark:text-warm-50">Leaderboard</h1>
        </div>
        <p className="text-sm text-warm-500">Discover the most popular writers and rising stars</p>
      </div>

      {/* Tabs */}
      <div className="px-4 lg:px-0">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200',
                activeTab === key
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-white dark:bg-warm-900 text-warm-600 dark:text-warm-400 border border-warm-200 dark:border-warm-800 hover:border-primary/30 hover:bg-primary/5'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="px-4 lg:px-0 space-y-3">
        {loading ? (
          <>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-warm-900 border border-warm-100 dark:border-warm-800">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="skeleton w-11 h-11 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-20 rounded" />
                </div>
                <div className="skeleton h-8 w-16 rounded-lg" />
              </div>
            ))}
          </>
        ) : data.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-12 h-12 text-warm-300 dark:text-warm-600 mx-auto mb-3" />
            <h3 className="font-semibold text-warm-700 dark:text-warm-300 mb-1">No data yet</h3>
            <p className="text-sm text-warm-500">The leaderboard will populate as writers publish content.</p>
          </div>
        ) : (
          data.map((entry: any) => (
            <LeaderboardRow
              key={entry.user.id}
              entry={entry}
              activeTab={activeTab}
              isFollowing={followingSet.has(entry.user.id)}
              onFollow={handleFollow}
              currentUserId={user?.id}
            />
          ))
        )}
      </div>

      {/* Footer note */}
      {!loading && data.length > 0 && (
        <div className="px-4 lg:px-0 text-center">
          <p className="text-xs text-warm-400">
            {activeTab === 'today' ? "Ranked by today's content performance" :
             activeTab === 'week' ? 'Based on content published in the last 7 days' :
             activeTab === 'month' ? 'Based on content published in the last 30 days' :
             activeTab === 'earners' ? 'Ranked by total earnings from content' :
             activeTab === 'rising' ? 'Showing new writers who joined in the last 30 days' :
             'Ranked by total views, likes, and follower count'}
          </p>
        </div>
      )}
    </div>
  );
}
