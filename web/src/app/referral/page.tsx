'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Gift, Copy, Share2, Users, Coins, Check, Star,
  ArrowRight, UserPlus, TrendingUp, MessageCircle,
  Twitter, Facebook, Link2, Mail, LogIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { referralApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';

const shareChannels = [
  { name: 'WhatsApp', icon: MessageCircle, color: 'bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400', action: 'whatsapp' },
  { name: 'Twitter', icon: Twitter, color: 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400', action: 'twitter' },
  { name: 'Facebook', icon: Facebook, color: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400', action: 'facebook' },
  { name: 'Email', icon: Mail, color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400', action: 'email' },
  { name: 'Copy Link', icon: Link2, color: 'bg-warm-100 text-warm-600 dark:bg-warm-800 dark:text-warm-400', action: 'copy' },
];

export default function ReferralPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState({ referralCount: 0, coinsEarned: 0, pendingInvites: 0, conversionRate: 0 });
  const [referredUsers, setReferredUsers] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    setLoading(true);
    try {
      const [codeRes, statsRes] = await Promise.allSettled([
        referralApi.getCode(),
        referralApi.getStats(),
      ]);
      if (codeRes.status === 'fulfilled') {
        const cData = codeRes.value.data?.data ?? codeRes.value.data;
        setReferralCode(cData?.code || cData?.referralCode || '');
      }
      if (statsRes.status === 'fulfilled') {
        const sData = statsRes.value.data?.data ?? statsRes.value.data;
        setStats({
          referralCount: Number(sData?.referralCount ?? sData?.totalReferrals ?? 0),
          coinsEarned: Number(sData?.coinsEarned ?? sData?.totalCoinsEarned ?? 0),
          pendingInvites: Number(sData?.pendingInvites ?? 0),
          conversionRate: Number(sData?.conversionRate ?? 0),
        });
        if (Array.isArray(sData?.referredUsers)) {
          setReferredUsers(sData.referredUsers);
        }
      }
    } catch {} finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { if (!authLoading) load(); }, [authLoading, load]);

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="px-4 lg:px-8 py-16 text-center space-y-4 max-w-md mx-auto">
        <Gift className="w-12 h-12 text-warm-300 mx-auto" />
        <h1 className="text-xl font-bold text-warm-900 dark:text-warm-50">Sign in to refer friends</h1>
        <p className="text-sm text-warm-500">Get your unique code and earn coins for every referral.</p>
        <Link href="/login?next=/referral">
          <Button icon={<LogIn className="w-4 h-4" />}>Sign in</Button>
        </Link>
      </div>
    );
  }

  const copyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (channel: string) => {
    const text = `Join Kalaloka - the best app for reading stories, poems & articles in Kannada! Use my referral code: ${referralCode}`;
    const url = `https://kalaloka.buzz/join?ref=${referralCode}`;

    if (channel === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`);
    } else if (channel === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
    } else if (channel === 'copy') {
      navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success('Link copied!');
    } else if (channel === 'email') {
      window.open(`mailto:?subject=Join Kalaloka!&body=${encodeURIComponent(text + '\n' + url)}`);
    } else {
      if (navigator.share) {
        navigator.share({ title: 'Join Kalaloka', text, url });
      } else {
        navigator.clipboard.writeText(`${text}\n${url}`);
        toast.success('Link copied!');
      }
    }
  };

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6 lg:space-y-8">
      {/* Hero */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/20">
          <Gift className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-warm-900 dark:text-warm-50 mb-2">Refer & Earn</h1>
        <p className="text-warm-500 max-w-lg mx-auto">Invite your friends to Kalaloka and earn 50 coins for every successful referral. Your friends get 50 coins too!</p>
      </div>

      {/* Referral Code + Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Code Card */}
        <div className="lg:col-span-2 bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 p-6">
          <p className="text-xs font-medium text-warm-500 mb-3 text-center">Your Referral Code</p>
          <div className="flex items-center justify-center gap-3 mb-5">
            <code className="text-3xl font-bold tracking-[0.3em] text-primary">{loading ? '...' : referralCode || 'N/A'}</code>
            <button onClick={copyCode} className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors">
              {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-primary" />}
            </button>
          </div>
          <Button onClick={() => handleShare('whatsapp')} className="w-full" size="lg" icon={<Share2 className="w-4 h-4" />}>
            Share with Friends
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="lg:col-span-3 grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <Users className="w-5 h-5 text-white/60 mb-2" />
            <p className="text-3xl font-bold">{stats.referralCount}</p>
            <p className="text-xs text-white/60">Friends Invited</p>
          </div>
          <div className="bg-white dark:bg-warm-900 rounded-2xl p-5 border border-warm-100 dark:border-warm-800">
            <Coins className="w-5 h-5 text-amber-500 mb-2" />
            <p className="text-3xl font-bold text-warm-900 dark:text-warm-100">{stats.coinsEarned}</p>
            <p className="text-xs text-warm-500">Points Earned</p>
          </div>
          <div className="bg-white dark:bg-warm-900 rounded-2xl p-5 border border-warm-100 dark:border-warm-800">
            <UserPlus className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-3xl font-bold text-warm-900 dark:text-warm-100">{stats.pendingInvites}</p>
            <p className="text-xs text-warm-500">Pending Invites</p>
          </div>
          <div className="bg-white dark:bg-warm-900 rounded-2xl p-5 border border-warm-100 dark:border-warm-800">
            <TrendingUp className="w-5 h-5 text-emerald-500 mb-2" />
            <p className="text-3xl font-bold text-warm-900 dark:text-warm-100">{stats.conversionRate}%</p>
            <p className="text-xs text-warm-500">Conversion Rate</p>
          </div>
        </div>
      </div>

      {/* Share Options */}
      <div>
        <h2 className="text-lg font-bold text-warm-900 dark:text-warm-50 mb-4">Share Via</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {shareChannels.map(({ name, icon: Icon, color, action }) => (
            <button
              key={name}
              onClick={() => handleShare(action)}
              className="flex items-center gap-3 p-4 bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 hover:border-primary/20 hover:shadow-md transition-all group"
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', color)}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-warm-700 dark:text-warm-300">{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Referred Users */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-warm-900 dark:text-warm-50">Referred Friends</h2>
          <Badge variant="primary" size="md">{referredUsers.length} friends</Badge>
        </div>
        <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 overflow-hidden">
          {referredUsers.length === 0 ? (
            <div className="text-center py-12 text-sm text-warm-500">
              {loading ? 'Loading...' : 'No referrals yet. Share your code to start earning!'}
            </div>
          ) : (
            <>
              {/* Desktop table header */}
              <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 bg-warm-50 dark:bg-warm-800/50 text-xs font-medium text-warm-500 uppercase tracking-wide">
                <div className="col-span-4">User</div>
                <div className="col-span-3">Joined</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3 text-right">Points Earned</div>
              </div>
              <div className="divide-y divide-warm-100 dark:divide-warm-800">
                {referredUsers.map((user: any) => (
                  <div key={user.id} className="grid grid-cols-12 gap-4 items-center px-5 py-4 hover:bg-warm-50/50 dark:hover:bg-warm-800/30 transition-colors">
                    <div className="col-span-12 lg:col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-warm-100 dark:bg-warm-800 flex items-center justify-center text-sm font-bold text-warm-600 dark:text-warm-400 flex-shrink-0">
                        {(user.name || user.username || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-warm-900 dark:text-warm-100">{user.name || 'User'}</p>
                        <p className="text-xs text-warm-400">@{user.username || '-'}</p>
                      </div>
                    </div>
                    <div className="hidden lg:flex col-span-3 items-center text-sm text-warm-500">
                      {user.joinedDate || user.createdAt ? new Date(user.joinedDate || user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </div>
                    <div className="hidden lg:flex col-span-2 items-center">
                      <Badge variant="success" size="sm">{user.status || 'Active'}</Badge>
                    </div>
                    <div className="hidden lg:flex col-span-3 items-center justify-end gap-1 text-amber-600 dark:text-amber-400">
                      <Coins className="w-3.5 h-3.5" />
                      <span className="text-sm font-bold">+{user.coinsEarned || 50}</span>
                    </div>
                    {/* Mobile extra info */}
                    <div className="col-span-12 lg:hidden flex items-center justify-between -mt-2 pl-[52px]">
                      <div className="flex items-center gap-2">
                        <Badge variant="success" size="sm">{user.status || 'Active'}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Coins className="w-3 h-3" />
                        <span className="text-xs font-bold">+{user.coinsEarned || 50}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-warm-50 dark:bg-warm-900/50 rounded-2xl p-6">
        <h3 className="font-bold text-warm-900 dark:text-warm-100 mb-5 text-center">How It Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: 1, title: 'Share Your Code', desc: 'Send your unique referral code to friends via WhatsApp, social media, or direct message', icon: Share2 },
            { step: 2, title: 'Friend Signs Up', desc: 'Your friend creates an account on Kalaloka using your referral code during registration', icon: UserPlus },
            { step: 3, title: 'Both Earn Points', desc: 'You and your friend each receive 50 Kalaloka Points as a welcome bonus!', icon: Coins },
          ].map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="text-center">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white text-lg font-bold mx-auto mb-3">{step}</div>
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-warm-800 flex items-center justify-center mx-auto mb-2 border border-warm-100 dark:border-warm-700">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-warm-800 dark:text-warm-200">{title}</p>
              <p className="text-xs text-warm-500 mt-1 max-w-xs mx-auto">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
