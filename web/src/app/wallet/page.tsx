'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Wallet, Gift, Star, CreditCard, TrendingUp, Coins,
  Download, LogIn, X, Flame, Award, Target, BookOpen, Loader2,
  Sparkles, Gem,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { walletApi, rewardsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';

type TxnRow = {
  id: string;
  description: string;
  transactionType: string;
  amount: number;
  createdAt: string;
};

const txnIcons: Record<string, { icon: typeof Gift; color: string }> = {
  GIFT: { icon: Gem, color: 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400' },
  SUPPORT: { icon: Star, color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
  PURCHASE: { icon: CreditCard, color: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
  REWARD: { icon: TrendingUp, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
};

const POINTS_PER_RUPEE = 10;
const MIN_WITHDRAW_POINTS = 400;

/** Point purchase packs */
const POINT_PACKS = [
  { price: 10, points: 100, bonus: 0, label: 'Starter' },
  { price: 50, points: 550, bonus: 10, label: 'Popular' },
  { price: 100, points: 1200, bonus: 20, label: 'Best Value' },
  { price: 500, points: 7000, bonus: 40, label: 'Mega Pack' },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function WalletPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({ wallet: 0, coins: 0 });
  const [transactions, setTransactions] = useState<TxnRow[]>([]);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawCoins, setWithdrawCoins] = useState('');
  const [withdrawDesc, setWithdrawDesc] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Rewards state
  const [rewardStats, setRewardStats] = useState<Record<string, any> | null>(null);
  const [rewardsLoading, setRewardsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setRewardsLoading(false);
      return;
    }
    setLoading(true);
    setRewardsLoading(true);
    try {
      const [wRes, tRes, rRes] = await Promise.all([
        walletApi.getBalance(),
        walletApi.getTransactions({ page: 1, limit: 15 }),
        rewardsApi.getStats().catch(() => ({ data: null })),
      ]);
      const w = wRes.data?.data ?? wRes.data;
      setBalance({
        wallet: Number(w?.walletBalance ?? 0),
        coins: Number(w?.coinsBalance ?? 0),
      });
      const raw = tRes.data?.data ?? tRes.data ?? [];
      const list = Array.isArray(raw) ? raw : [];
      setTransactions(
        list.map((t: any) => ({
          id: t.id,
          description: t.description || t.type || 'Transaction',
          transactionType: t.type || 'OTHER',
          amount: Number(t.amount),
          createdAt: typeof t.createdAt === 'string' ? t.createdAt : new Date(t.createdAt).toISOString(),
        }))
      );
      setRewardStats(rRes.data?.data ?? rRes.data);
    } catch {
      setTransactions([]);
      setRewardStats(null);
    } finally {
      setLoading(false);
      setRewardsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, load]);

  const handleWithdraw = async () => {
    const points = parseInt(withdrawCoins);
    if (isNaN(points) || points < MIN_WITHDRAW_POINTS) {
      toast.error(`Minimum withdrawal is ${MIN_WITHDRAW_POINTS} Points (= Rs ${MIN_WITHDRAW_POINTS / POINTS_PER_RUPEE})`);
      return;
    }
    if (points > balance.coins) {
      toast.error('Insufficient Points');
      return;
    }
    setWithdrawLoading(true);
    try {
      const inrAmount = points / POINTS_PER_RUPEE;
      await walletApi.withdraw({ amount: inrAmount, description: withdrawDesc.trim() || 'Withdrawal request' });
      toast.success('Withdrawal request submitted');
      setShowWithdraw(false);
      setWithdrawCoins('');
      setWithdrawDesc('');
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Withdrawal failed');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((txn) => {
    if (filter === 'all') return true;
    if (filter === 'credit') return txn.amount > 0;
    return txn.amount < 0;
  });

  const coinsINR = balance.coins / POINTS_PER_RUPEE;

  // Rewards data
  const rawTodayCoins = rewardStats?.todayCoinsEarned ?? 0;
  const dailyCap = rewardStats?.dailyCoinCap ?? 20;
  const todayCoins = Math.min(rawTodayCoins, dailyCap); // Never show more than cap
  const streak = rewardStats?.currentStreak ?? 0;
  const longestStreak = rewardStats?.longestStreak ?? 0;
  const progressPct = dailyCap > 0 ? Math.min(100, Math.round((todayCoins / dailyCap) * 100)) : 0;

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="px-4 lg:px-8 py-16 text-center space-y-4 max-w-md mx-auto">
        <Wallet className="w-12 h-12 text-warm-300 mx-auto" />
        <h1 className="text-xl font-bold text-warm-900 dark:text-warm-50">Sign in to use your wallet</h1>
        <p className="text-sm text-warm-500">View your Points balance, earnings, and transactions.</p>
        <Link href="/login?next=/wallet">
          <Button icon={<LogIn className="w-4 h-4" />}>Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6 lg:space-y-8 pb-28 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50">Wallet</h1>
            <p className="text-sm text-warm-500">Your Points, rewards, and earnings</p>
          </div>
        </div>
        <Button size="sm" variant="secondary" icon={<Download className="w-4 h-4" />} onClick={() => setShowWithdraw(true)}>Withdraw</Button>
      </div>

      {/* Big balance card — full width on mobile */}
      <div className="rounded-2xl overflow-hidden gradient-primary p-5 sm:p-6 text-white relative -mx-4 sm:mx-0 rounded-none sm:rounded-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center gap-2 mb-1">
          <Coins className="w-5 h-5 text-white/70" />
          <p className="text-white/70 text-sm">Your Points</p>
        </div>
        <p className="text-4xl font-bold mb-1">
          {loading ? '...' : balance.coins.toLocaleString('en-IN')}
        </p>
        <p className="text-lg text-white/80 font-medium">
          = Rs {loading ? '...' : coinsINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-white/50 mt-2">10 Points = Rs 1 | Min withdrawal: {MIN_WITHDRAW_POINTS} Points</p>
      </div>

      {/* Buy Points Section */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 rounded-2xl p-5 border border-amber-200/50 dark:border-amber-800/30">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-warm-900 dark:text-warm-100">Buy Points</h3>
            <p className="text-[11px] text-warm-500">Get bonus Points on larger packs</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {POINT_PACKS.map((pack) => (
            <button
              key={pack.price}
              className="relative bg-white dark:bg-warm-900 rounded-xl border-2 border-warm-100 dark:border-warm-800 p-4 text-center hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] group"
            >
              {pack.bonus > 0 && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  +{pack.bonus}% bonus
                </span>
              )}
              <p className="text-2xl font-bold text-warm-900 dark:text-warm-100 mt-1">{pack.points.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-warm-500 mb-2">Points</p>
              <div className="bg-primary/10 dark:bg-primary/20 text-primary font-bold text-sm py-1.5 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                Rs {pack.price}
              </div>
              <p className="text-[10px] text-warm-400 mt-1.5">{pack.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Today's earnings + streak section */}
      {rewardsLoading ? (
        <div className="flex items-center justify-center py-6 gap-2 text-warm-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading rewards...</span>
        </div>
      ) : rewardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Today's progress */}
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/70 text-sm">Today's Earnings</p>
              <span className="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded-full">{progressPct}%</span>
            </div>
            <p className="text-2xl font-bold">{todayCoins} <span className="text-base font-normal text-white/60">/ {dailyCap} Points</span></p>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[10px] text-white/40 mt-1.5">Daily cap: {dailyCap} Points/day (= Rs {(dailyCap / 10).toFixed(0)}/day)</p>
          </div>

          {/* Streak + stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-warm-900 rounded-2xl p-4 border border-warm-100 dark:border-warm-800">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center mb-2">
                <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-lg font-bold text-warm-900 dark:text-warm-100">{streak} days</p>
              <p className="text-[11px] text-warm-500">Reading Streak</p>
            </div>
            <div className="bg-white dark:bg-warm-900 rounded-2xl p-4 border border-warm-100 dark:border-warm-800">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center mb-2">
                <Award className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-lg font-bold text-warm-900 dark:text-warm-100">{longestStreak} days</p>
              <p className="text-[11px] text-warm-500">Best Streak</p>
            </div>
            <div className="bg-white dark:bg-warm-900 rounded-2xl p-4 border border-warm-100 dark:border-warm-800 col-span-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-warm-900 dark:text-warm-100">
                    {(rewardStats?.totalCoinsEarned ?? 0).toLocaleString('en-IN')} Points earned all time
                  </p>
                  <p className="text-[11px] text-warm-500">
                    {rewardStats?.monthCoinsEarned ?? 0} Points this month
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Balance (INR) */}
      <div className="rounded-2xl bg-white dark:bg-warm-900 border border-warm-100 dark:border-warm-800 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-warm-500 mb-1">Wallet Balance (INR)</p>
            <p className="text-2xl font-bold text-warm-900 dark:text-warm-100">
              {loading ? '...' : `Rs ${balance.wallet.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </p>
            <p className="text-xs text-warm-400 mt-0.5">Earned from gems, episode unlocks, and ad revenue share</p>
          </div>
          <Button
            size="sm"
            variant="primary"
            icon={<Download className="w-4 h-4" />}
            onClick={() => setShowWithdraw(true)}
            disabled={balance.coins < MIN_WITHDRAW_POINTS}
          >
            Withdraw
          </Button>
        </div>
      </div>

      {/* How to Earn */}
      <div className="bg-warm-50 dark:bg-warm-900/50 rounded-2xl p-5">
        <h3 className="font-bold text-warm-900 dark:text-warm-100 mb-3">How to Earn Points</h3>
        <div className="space-y-2">
          {[
            { icon: BookOpen, title: 'Read stories', desc: 'Earn 2 Points per valid reading session (3 min+, 50% scroll)', coins: 2 },
            { icon: Target, title: 'Complete a full story', desc: 'Bonus Points for finishing an entire piece', coins: 5 },
            { icon: Flame, title: '7-day reading streak', desc: 'Keep reading daily for 7 days straight', coins: 10 },
          ].map(({ icon: Icon, title, desc, coins }) => (
            <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-warm-900 border border-warm-100 dark:border-warm-800">
              <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-warm-800 dark:text-warm-200">{title}</p>
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 px-2 py-0.5 rounded-md">
                    +{coins} Points
                  </span>
                </div>
                <p className="text-xs text-warm-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-warm-900 dark:text-warm-50">Transaction History</h2>
          <div className="flex gap-1 bg-warm-100 dark:bg-warm-800 rounded-lg p-0.5">
            {(['all', 'credit', 'debit'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize',
                  filter === f
                    ? 'bg-white dark:bg-warm-700 text-warm-900 dark:text-warm-100 shadow-sm'
                    : 'text-warm-500 hover:text-warm-700 dark:hover:text-warm-300'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 overflow-hidden">
          <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 bg-warm-50 dark:bg-warm-800/50 text-xs font-medium text-warm-500 uppercase tracking-wide">
            <div className="col-span-5">Transaction</div>
            <div className="col-span-3">Date</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>

          <div className="divide-y divide-warm-100 dark:divide-warm-800">
            {loading ? (
              <div className="px-5 py-12 text-center text-sm text-warm-500">Loading...</div>
            ) : (
              filteredTransactions.map((txn) => {
                const isCredit = txn.amount > 0;
                const typeInfo = txnIcons[txn.transactionType] || txnIcons.REWARD;
                const Icon = typeInfo.icon;

                return (
                  <div key={txn.id} className="grid grid-cols-12 gap-4 items-center px-5 py-4 hover:bg-warm-50/50 dark:hover:bg-warm-800/30 transition-colors">
                    <div className="col-span-12 lg:col-span-5 flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', typeInfo.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-warm-900 dark:text-warm-100 truncate">{txn.description.replace(/\bPens?\b/gi, 'Points')}</p>
                        <p className="text-xs text-warm-400 lg:hidden">{formatDate(txn.createdAt)}</p>
                      </div>
                    </div>
                    <div className="hidden lg:flex col-span-3 items-center text-sm text-warm-500">
                      {formatDate(txn.createdAt)}
                    </div>
                    <div className="hidden lg:flex col-span-2 items-center">
                      <Badge variant={isCredit ? 'success' : 'secondary'} size="sm">
                        {txn.transactionType}
                      </Badge>
                    </div>
                    <div className="hidden lg:flex col-span-2 items-center justify-end">
                      <span className={cn('text-sm font-bold', isCredit ? 'text-emerald-600' : 'text-red-500')}>
                        {isCredit ? '+' : ''}{Math.abs(txn.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="col-span-12 lg:hidden flex items-center justify-between -mt-2 pl-[52px]">
                      <Badge variant={isCredit ? 'success' : 'secondary'} size="sm">
                        {txn.transactionType}
                      </Badge>
                      <span className={cn('text-sm font-bold', isCredit ? 'text-emerald-600' : 'text-red-500')}>
                        {isCredit ? '+' : ''}{Math.abs(txn.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {!loading && filteredTransactions.length === 0 && (
          <div className="text-center py-12 text-sm text-warm-500">No transactions yet</div>
        )}
      </div>

      {/* Withdraw modal — centered on all screens */}
      {showWithdraw && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={() => setShowWithdraw(false)}>
          <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-200 dark:border-warm-700 shadow-xl max-w-sm w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-warm-900 dark:text-warm-50">Withdraw Points</h2>
              <button type="button" onClick={() => setShowWithdraw(false)} className="p-1 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-800 text-warm-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-warm-500">
              Available: <span className="font-bold text-warm-900 dark:text-warm-100">{balance.coins.toLocaleString('en-IN')} Points</span>
              <span className="text-warm-400"> (= Rs {coinsINR.toFixed(2)})</span>
            </p>
            <div>
              <label className="text-xs font-medium text-warm-600 dark:text-warm-400 mb-1.5 block">Points to withdraw (min {MIN_WITHDRAW_POINTS})</label>
              <input
                type="number"
                min={MIN_WITHDRAW_POINTS}
                max={balance.coins}
                step="1"
                value={withdrawCoins}
                onChange={(e) => setWithdrawCoins(e.target.value)}
                placeholder={`${MIN_WITHDRAW_POINTS}`}
                className="w-full px-4 py-2.5 text-sm bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-warm-900 dark:text-warm-100"
              />
              {withdrawCoins && parseInt(withdrawCoins) > 0 && (
                <p className="text-xs text-warm-400 mt-1">= Rs {(parseInt(withdrawCoins) / POINTS_PER_RUPEE).toFixed(2)}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-warm-600 dark:text-warm-400 mb-1.5 block">UPI ID or note</label>
              <input
                type="text"
                value={withdrawDesc}
                onChange={(e) => setWithdrawDesc(e.target.value)}
                placeholder="your-upi@bank"
                className="w-full px-4 py-2.5 text-sm bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-warm-900 dark:text-warm-100"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowWithdraw(false)}>Cancel</Button>
              <Button type="button" className="flex-1" loading={withdrawLoading} onClick={handleWithdraw} icon={<Download className="w-4 h-4" />}>
                Withdraw
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
