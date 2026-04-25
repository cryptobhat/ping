'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  TrendingUp, Wallet, Gift, Star, Coins, PenTool, BookOpen,
  ArrowUpRight, Download, Eye, Heart, Users, BarChart3,
  Calendar, ChevronRight, LogIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { rewardsApi, walletApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const earningSources = [
  { icon: Gift, label: 'Gifts from readers', key: 'giftsEarned', color: 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400' },
  { icon: Star, label: 'Ad revenue share', key: 'lifetimeAdShareINR', color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
  { icon: TrendingUp, label: 'Reading rewards', key: 'totalPointsEarned', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
  { icon: Users, label: 'Referral bonuses', key: 'referralEarned', color: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
];

export default function EarningsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [walletBalance, setWalletBalance] = useState(0);

  const load = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    setLoading(true);
    try {
      const [sRes, wRes] = await Promise.allSettled([
        rewardsApi.getStats(),
        walletApi.getBalance(),
      ]);
      if (sRes.status === 'fulfilled') setStats(sRes.value.data?.data ?? sRes.value.data ?? {});
      if (wRes.status === 'fulfilled') {
        const w = wRes.value.data?.data ?? wRes.value.data;
        setWalletBalance(Number(w?.walletBalance ?? 0));
      }
    } catch {} finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { if (!authLoading) load(); }, [authLoading, load]);

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="px-4 lg:px-8 py-16 text-center space-y-4 max-w-md mx-auto">
        <TrendingUp className="w-12 h-12 text-warm-300 mx-auto" />
        <h1 className="text-xl font-bold text-warm-900 dark:text-warm-50">Sign in to view earnings</h1>
        <p className="text-sm text-warm-500">Track your writing income after signing in.</p>
        <Link href="/login?next=/earnings">
          <Button icon={<LogIn className="w-4 h-4" />}>Sign in</Button>
        </Link>
      </div>
    );
  }

  const totalPts = Number(stats.totalPointsEarned ?? 0);
  const currentPens = Number(stats.currentPens ?? 0);
  const adShareTotal = Number(stats.lifetimeAdShareINR ?? 0);

  const monthlyData = stats.monthlyData ?? [];
  const maxAmount = monthlyData.length > 0 ? Math.max(...monthlyData.map((d: any) => Number(d.amount || 0)), 1) : 1;

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50">Earnings</h1>
            <p className="text-sm text-warm-500">Track your writing income</p>
          </div>
        </div>
        <Link href="/wallet">
          <Button variant="outline" size="sm" icon={<Wallet className="w-4 h-4" />}>Go to Wallet</Button>
        </Link>
      </div>

      {/* Stats Cards - 4 columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <p className="text-white/70 text-xs mb-1">Wallet Balance</p>
          <p className="text-2xl font-bold">{loading ? '...' : `\u20B9${walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
          <div className="flex items-center gap-1 mt-1 text-emerald-200 text-xs">
            <ArrowUpRight className="w-3 h-3" />
            Current balance
          </div>
        </div>

        <div className="bg-white dark:bg-warm-900 rounded-2xl p-5 border border-warm-100 dark:border-warm-800">
          <p className="text-xs text-warm-500 mb-1">Ad Revenue Share</p>
          <p className="text-2xl font-bold text-warm-900 dark:text-warm-100">{loading ? '...' : `\u20B9${adShareTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
          <div className="flex items-center gap-1 mt-1 text-emerald-600 text-xs font-medium">
            <ArrowUpRight className="w-3 h-3" />
            Lifetime
          </div>
        </div>

        <div className="bg-white dark:bg-warm-900 rounded-2xl p-5 border border-warm-100 dark:border-warm-800">
          <p className="text-xs text-warm-500 mb-1">Points Earned</p>
          <p className="text-2xl font-bold text-warm-900 dark:text-warm-100">{loading ? '...' : totalPts.toLocaleString('en-IN')}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-warm-400">
            <Coins className="w-3 h-3 text-amber-500" />
            All time
          </div>
        </div>

        <div className="bg-white dark:bg-warm-900 rounded-2xl p-5 border border-warm-100 dark:border-warm-800">
          <p className="text-xs text-warm-500 mb-1">Kalaloka Pens</p>
          <p className="text-2xl font-bold text-warm-900 dark:text-warm-100">{loading ? '...' : currentPens.toLocaleString('en-IN')}</p>
          <p className="text-xs text-warm-400 mt-1">Send gifts to writers</p>
        </div>
      </div>

      {/* Chart + Sources - 2 column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Monthly Chart */}
        <div className="lg:col-span-3 bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-warm-900 dark:text-warm-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Monthly Earnings
            </h3>
            <Badge variant="success" size="sm">Lifetime</Badge>
          </div>
          <div className="flex items-end gap-3 h-40">
            {monthlyData.length > 0 ? monthlyData.map((d: any, i: number) => (
              <div key={d.month || i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[11px] font-medium text-warm-600 dark:text-warm-400">{'\u20B9'}{Number(d.amount || 0)}</span>
                <div
                  className={cn(
                    'w-full rounded-lg transition-all',
                    i === monthlyData.length - 1 ? 'gradient-primary' : 'bg-warm-200 dark:bg-warm-700'
                  )}
                  style={{ height: `${(Number(d.amount || 0) / maxAmount) * 100}%`, minHeight: '8px' }}
                />
                <span className="text-[11px] text-warm-500">{d.month || ''}</span>
              </div>
            )) : (
              <div className="flex-1 flex items-center justify-center text-sm text-warm-400">
                {loading ? 'Loading...' : 'No data yet'}
              </div>
            )}
          </div>
        </div>

        {/* Earning Sources */}
        <div className="lg:col-span-2 bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 p-5">
          <h3 className="font-bold text-warm-900 dark:text-warm-100 mb-4">Earning Sources</h3>
          <div className="space-y-4">
            {earningSources.map(({ icon: Icon, label, key, color }) => {
              const amount = Number(stats[key] ?? 0);
              const total = earningSources.reduce((s, src) => s + Number(stats[src.key] ?? 0), 0);
              const percent = total > 0 ? Math.round((amount / total) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-warm-700 dark:text-warm-300">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-warm-900 dark:text-warm-100">{loading ? '...' : amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-warm-100 dark:bg-warm-800 rounded-full h-1.5">
                    <div className="gradient-primary h-1.5 rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Performance Info */}
      <div>
        <h2 className="text-lg font-bold text-warm-900 dark:text-warm-50 mb-4">Content Performance</h2>
        <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 p-8 text-center">
          {loading ? (
            <p className="text-sm text-warm-500">Loading...</p>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="Analytics coming soon"
              description="Per-content earnings breakdown will land here. Visit Rewards for current points."
            />
          )}
        </div>
      </div>
    </div>
  );
}
