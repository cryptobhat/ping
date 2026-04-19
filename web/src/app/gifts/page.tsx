'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { giftApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Gem, Coins, Info } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

type CatalogGift = {
  id: string;
  name: string;
  description?: string | null;
  coinPrice: number;
  iconEmoji?: string | null;
  imageUrl?: string | null;
};

function GiftsPageContent() {
  const { user, isAuthenticated } = useAuthStore();
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({ received: 0, sent: 0 });
  const [loading, setLoading] = useState(true);

  const coinsBalance = user?.coins ?? 0;

  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [rec, sent] = await Promise.all([
        giftApi.getReceived({ page: 1, limit: 50 }),
        giftApi.getSent({ page: 1, limit: 50 }),
      ]);
      const recBody = rec.data as { data?: any[]; pagination?: { total?: number } };
      const sentBody = sent.data as { data?: any[]; pagination?: { total?: number } };
      const recData = recBody?.data ?? [];
      const sentData = sentBody?.data ?? [];
      setStats({
        received: recBody?.pagination?.total ?? (Array.isArray(recData) ? recData.length : 0),
        sent: sentBody?.pagination?.total ?? (Array.isArray(sentData) ? sentData.length : 0),
      });
      const items = tab === 'received' ? recData : sentData;
      setHistory(Array.isArray(items) ? items : []);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, tab]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  if (!isAuthenticated) {
    return (
      <div className="px-4 py-16 max-w-md mx-auto text-center space-y-4">
        <Gem className="w-14 h-14 mx-auto text-primary" />
        <h1 className="text-xl font-bold text-warm-900 dark:text-warm-50">Gem History</h1>
        <p className="text-sm text-warm-500">
          See gems you have sent and received. Sign in to get started.
        </p>
        <Link href="/login?next=/gifts" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6 lg:space-y-8">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
          <Gem className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50">Gem History</h1>
          <p className="text-sm text-warm-500">Gems you have sent and received</p>
        </div>
      </div>

      <div className="rounded-xl border border-warm-200 dark:border-warm-700 bg-warm-50/80 dark:bg-warm-900/40 px-4 py-3 flex gap-3">
        <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-warm-600 dark:text-warm-400">
          To send a gem, open any story and tap <span className="font-semibold text-warm-800 dark:text-warm-200">Send a Gem</span> at the bottom. Gems are sent directly from the reading page.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 p-4 text-center">
          <p className="text-2xl font-bold text-warm-900 dark:text-warm-100">{stats.received}</p>
          <p className="text-xs text-warm-500 mt-0.5">Received</p>
        </div>
        <div className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 p-4 text-center">
          <p className="text-2xl font-bold text-warm-900 dark:text-warm-100">{stats.sent}</p>
          <p className="text-xs text-warm-500 mt-0.5">Sent</p>
        </div>
        <div className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <Coins className="w-4 h-4 text-amber-500" />
            <p className="text-2xl font-bold text-warm-900 dark:text-warm-100">{coinsBalance}</p>
          </div>
          <p className="text-xs text-warm-500 mt-0.5">Your Points</p>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <h2 className="text-lg font-bold text-warm-900 dark:text-warm-50">History</h2>
          <div className="flex gap-1 bg-warm-100 dark:bg-warm-800 rounded-lg p-0.5">
            {(['received', 'sent'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  'px-4 py-1.5 text-xs font-medium rounded-md transition-all capitalize',
                  tab === t ? 'bg-white dark:bg-warm-700 text-warm-900 dark:text-warm-100 shadow-sm' : 'text-warm-500'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 overflow-hidden">
          {loading ? (
            <p className="text-sm text-warm-500 text-center py-10">Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-warm-500 text-center py-10">No gems yet.</p>
          ) : (
            <div className="divide-y divide-warm-100 dark:divide-warm-800">
              {history.map((item: any) => {
                const other = tab === 'received' ? item.sender : item.receiver;
                const g = item.gift as CatalogGift | undefined;
                return (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-warm-50/50 dark:hover:bg-warm-800/30">
                    <Link href={other?.username ? `/user/${other.username}` : '#'}>
                      <Avatar src={other?.profileImage} name={other?.name || '?'} size="md" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-warm-900 dark:text-warm-100">
                          {other?.name || 'User'}
                        </span>
                        {g && (
                          <>
                            <span className="text-lg">{g.iconEmoji || ''}</span>
                            <Badge variant="secondary" size="sm">
                              {g.name}
                            </Badge>
                          </>
                        )}
                      </div>
                      {item.message ? <p className="text-xs text-warm-500 mt-0.5 truncate">&ldquo;{item.message}&rdquo;</p> : null}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center justify-end gap-1 text-amber-600 dark:text-amber-400">
                        <Coins className="w-3 h-3" />
                        <span className="text-sm font-bold">
                          {tab === 'received' ? '+' : '-'}
                          {item.coinPrice} pts
                        </span>
                      </div>
                      <p className="text-[11px] text-warm-400 mt-0.5">{formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GiftsPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-16 text-center text-warm-500 text-sm">Loading gems...</div>
      }
    >
      <GiftsPageContent />
    </Suspense>
  );
}
