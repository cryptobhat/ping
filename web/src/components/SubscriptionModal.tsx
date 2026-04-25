'use client';

import { useEffect, useState } from 'react';
import { X, Crown, Check, Zap, Shield, BookOpen, Star, Gift } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getReadingLang } from '@/lib/reading-lang';
import { t } from '@/lib/copy';
import Link from 'next/link';

const BOT_UA_RE = /Googlebot|bingbot|YandexBot|Baiduspider|DuckDuckBot|Slurp/i;

export function SubscriptionModal() {
  const [show, setShow] = useState(false);
  const [lang, setLang] = useState('en');
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    setLang(getReadingLang() || 'en');
  }, []);

  useEffect(() => {
    // Skip modal entirely for premium users
    if (user?.isPremium) return;

    // Skip for SEO crawlers — they shouldn't see a popup blocking the LCP/CLS
    if (typeof navigator !== 'undefined' && BOT_UA_RE.test(navigator.userAgent || '')) {
      return;
    }

    // Respect 24h dismissal cooldown
    const dismissed = localStorage.getItem('sub_modal_dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 24 * 60 * 60 * 1000) return;
    }

    // Defer until the browser is idle OR the user interacts — avoids
    // competing with first paint and TTI. Whichever fires first wins.
    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      setShow(true);
      cleanup();
    };

    const onInteraction = () => fire();
    const cleanup = () => {
      window.removeEventListener('scroll', onInteraction);
      window.removeEventListener('click', onInteraction);
      window.removeEventListener('keydown', onInteraction);
      if (idleHandle != null) {
        const w = window as any;
        if (typeof w.cancelIdleCallback === 'function') w.cancelIdleCallback(idleHandle);
        else clearTimeout(idleHandle);
      }
    };

    window.addEventListener('scroll', onInteraction, { passive: true, once: true });
    window.addEventListener('click', onInteraction, { once: true });
    window.addEventListener('keydown', onInteraction, { once: true });

    const w = window as any;
    let idleHandle: any = null;
    if (typeof w.requestIdleCallback === 'function') {
      idleHandle = w.requestIdleCallback(fire, { timeout: 4000 });
    } else {
      idleHandle = setTimeout(fire, 2500);
    }

    return cleanup;
  }, [user?.isPremium]);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('sub_modal_dismissed', String(Date.now()));
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 animate-fade-in" onClick={dismiss} aria-hidden="true" />
      <div className="relative w-full max-w-sm mx-4 mb-0 sm:mb-0 bg-white dark:bg-warm-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up">

        {/* Close */}
        <button onClick={dismiss} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/30 transition-colors">
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Header — price hero */}
        <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 px-6 pt-8 pb-6 text-white text-center">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-3">
              <Crown className="w-7 h-7" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Premium Membership</p>
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-5xl font-black">₹11</span>
              <span className="text-lg text-white/70 font-medium">/month</span>
            </div>
            <p className="text-sm text-white/80">{t('subChaiHeadline', lang)}</p>
          </div>
        </div>

        {/* Benefits — compact */}
        <div className="px-5 py-4 space-y-2.5">
          {[
            { icon: BookOpen, text: 'Unlimited premium stories & series', color: 'text-blue-500' },
            { icon: Shield, text: 'Ad-free reading experience', color: 'text-green-500' },
            { icon: Star, text: 'Exclusive writing competitions', color: 'text-amber-500' },
            { icon: Gift, text: 'Monthly bonus coins + badge', color: 'text-purple-500' },
            { icon: Zap, text: 'Early access to new features', color: 'text-orange-500' },
          ].map(({ icon: Icon, text, color }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-warm-50 dark:bg-warm-800 flex items-center justify-center flex-shrink-0">
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <span className="text-[13px] text-warm-700 dark:text-warm-300">{text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-5 pb-5 pt-2 space-y-2">
          <Link
            href={isAuthenticated ? '/subscription' : '/login?redirect=/subscription'}
            onClick={dismiss}
            className="block w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all text-[15px] active:scale-[0.98]"
          >
            Subscribe — ₹11/month
          </Link>
          <button onClick={dismiss} className="w-full py-2 text-xs text-warm-400 hover:text-warm-600 transition-colors">
            No thanks, I&apos;ll read with ads
          </button>
        </div>
      </div>
    </div>
  );
}
