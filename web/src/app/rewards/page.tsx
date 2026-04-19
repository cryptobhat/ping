'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  Coins, Flame, Award, Target, BookOpen, Loader2,
  Wallet, TrendingUp, Calendar, Gift, Zap, ChevronRight, LogIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { rewardsApi, walletApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function RewardsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, any> | null>(null);
  const [balance, setBalance] = useState({ coins: 0, wallet: 0 });

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [rRes, wRes] = await Promise.all([
        rewardsApi.getStats().catch(() => ({ data: null })),
        walletApi.getBalance().catch(() => ({ data: null })),
      ]);
      setStats(rRes.data?.data ?? rRes.data);
      const w = wRes.data?.data ?? wRes.data;
      setBalance({
        coins: Number(w?.coinsBalance ?? 0),
        wallet: Number(w?.walletBalance ?? 0),
      });
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const todayCoins = Math.min(stats?.todayCoinsEarned ?? 0, stats?.dailyCoinCap ?? 20);
  const dailyCap = stats?.dailyCoinCap ?? 20;
  const streak = stats?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;
  const totalEarned = stats?.totalCoinsEarned ?? 0;
  const monthEarned = stats?.monthCoinsEarned ?? 0;
  const progressPct = dailyCap > 0 ? Math.min(100, Math.round((todayCoins / dailyCap) * 100)) : 0;

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="px-4 lg:px-8 py-16 text-center space-y-4 max-w-md mx-auto">
        <Coins className="w-12 h-12 text-warm-300 mx-auto" />
        <h1 className="text-xl font-bold text-warm-900 dark:text-warm-50">Sign in to view rewards</h1>
        <p className="text-sm text-warm-500">Track your reading rewards, streaks, and earnings.</p>
        <Link href="/login?next=/rewards">
          <Button icon={<LogIn className="w-4 h-4" />}>Sign in</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-warm-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading rewards...</span>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6 lg:space-y-8 pb-28 lg:pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50">Rewards</h1>
            <p className="text-sm text-warm-500">Earn Points by reading and engaging</p>
          </div>
        </div>
        <Link href="/wallet">
          <Button size="sm" variant="secondary" icon={<Wallet className="w-4 h-4" />}>
            Wallet
          </Button>
        </Link>
      </div>

      {/* Coin balance hero -- full-bleed on mobile */}
      <div className="rounded-2xl overflow-hidden gradient-primary p-6 sm:p-8 text-white relative -mx-4 sm:mx-0 rounded-none sm:rounded-2xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-5 h-5 text-white/70" />
            <p className="text-white/70 text-sm font-medium">Your Points Balance</p>
          </div>
          <p className="text-5xl font-bold mb-1 tracking-tight">
            {balance.coins.toLocaleString('en-IN')}
          </p>
          <p className="text-lg text-white/80 font-medium">
            = Rs {(balance.coins / 10).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-white/50 mt-3">10 Points = Rs 1</p>
        </div>
      </div>

      {/* Today's Earnings with progress bar */}
      <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-300" />
              <p className="text-white/80 text-sm font-medium">Today's Earnings</p>
            </div>
            <span className="text-xs text-white/50 bg-white/10 px-2.5 py-0.5 rounded-full font-medium">
              {progressPct}%
            </span>
          </div>
          <p className="text-3xl font-bold mb-1">
            {todayCoins} <span className="text-base font-normal text-white/60">/ {dailyCap} Points</span>
          </p>
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-gradient-to-r from-yellow-300 to-amber-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-[11px] text-white/40 mt-2">
            Daily cap: {dailyCap} Points/day (= Rs {(dailyCap / 10).toFixed(0)}/day)
          </p>
        </div>
      </div>

      {/* Reading streak + stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Current streak */}
        <div className="bg-white dark:bg-warm-900 rounded-2xl p-4 sm:p-5 border border-warm-100 dark:border-warm-800 hover-lift">
          <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center mb-3">
            <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-warm-900 dark:text-warm-100">{streak}</p>
          <p className="text-xs text-warm-500 mt-0.5">Day Streak</p>
        </div>

        {/* Best streak */}
        <div className="bg-white dark:bg-warm-900 rounded-2xl p-4 sm:p-5 border border-warm-100 dark:border-warm-800 hover-lift">
          <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mb-3">
            <Award className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-2xl font-bold text-warm-900 dark:text-warm-100">{longestStreak}</p>
          <p className="text-xs text-warm-500 mt-0.5">Best Streak</p>
        </div>

        {/* Total earned */}
        <div className="bg-white dark:bg-warm-900 rounded-2xl p-4 sm:p-5 border border-warm-100 dark:border-warm-800 hover-lift">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-warm-900 dark:text-warm-100">
            {totalEarned.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-warm-500 mt-0.5">Total Earned</p>
        </div>

        {/* This month */}
        <div className="bg-white dark:bg-warm-900 rounded-2xl p-4 sm:p-5 border border-warm-100 dark:border-warm-800 hover-lift">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-warm-900 dark:text-warm-100">
            {monthEarned.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-warm-500 mt-0.5">This Month</p>
        </div>
      </div>

      {/* Wallet balance quick card */}
      <div className="bg-white dark:bg-warm-900 rounded-2xl p-5 border border-warm-100 dark:border-warm-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-warm-500">Wallet Balance (INR)</p>
              <p className="text-xl font-bold text-warm-900 dark:text-warm-100">
                Rs {balance.wallet.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <Link href="/wallet">
            <Button size="sm" variant="outline" icon={<ChevronRight className="w-4 h-4" />}>
              View
            </Button>
          </Link>
        </div>
      </div>

      {/* How to Earn section */}
      <div className="bg-warm-50 dark:bg-warm-900/50 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
            <Gift className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="font-bold text-warm-900 dark:text-warm-100">How to Earn Points</h3>
            <p className="text-[11px] text-warm-500">Read, engage, and earn real money</p>
          </div>
        </div>
        <div className="space-y-2.5">
          {[
            {
              icon: BookOpen,
              title: 'Read stories',
              desc: 'Earn 2 Points per valid reading session (3 min+, 50% scroll)',
              coins: 2,
              color: 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
            },
            {
              icon: Target,
              title: 'Complete a full story',
              desc: 'Bonus Points for finishing an entire piece',
              coins: 5,
              color: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
            },
            {
              icon: Flame,
              title: '7-day reading streak',
              desc: 'Keep reading daily for 7 days straight',
              coins: 10,
              color: 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400',
            },
            {
              icon: Gift,
              title: 'Refer a friend',
              desc: 'Earn Points when your friend signs up and starts reading',
              coins: 20,
              color: 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
            },
          ].map(({ icon: Icon, title, desc, coins, color }) => (
            <div
              key={title}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-warm-900 border border-warm-100 dark:border-warm-800 hover:border-primary/20 transition-colors"
            >
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-warm-800 dark:text-warm-200">{title}</p>
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 px-2.5 py-0.5 rounded-md whitespace-nowrap">
                    +{coins} Points
                  </span>
                </div>
                <p className="text-xs text-warm-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center pb-4">
        <p className="text-xs text-warm-400">
          Points are earned through genuine reading activity. Automated or fraudulent activity may result in loss of Points.
        </p>
      </div>
    </div>
  );
}
