'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight, Globe2, BookOpen, ChevronDown, ChevronUp, Shield, Flag, MapPin, Languages } from 'lucide-react';
import {
  LANGUAGES,
  READING_LANG_KEY,
  setReadingLang,
  languageLabel,
} from '@/lib/reading-lang';

const QUICK_CODES = ['hi', 'kn', 'en', 'ta', 'te'] as const;

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasSavedLang, setHasSavedLang] = useState(false);
  const [savedCode, setSavedCode] = useState('');
  const [showAllLangs, setShowAllLangs] = useState(false);

  const rawNext = searchParams.get('next');
  const nextSafe =
    rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : null;
  const destination = nextSafe ?? '/';
  const signingInAfter = nextSafe === '/login';

  const quickLangs = useMemo(
    () =>
      QUICK_CODES.map((c) => LANGUAGES.find((l) => l.code === c)).filter(
        (x): x is (typeof LANGUAGES)[number] => Boolean(x)
      ),
    []
  );

  const moreLangs = useMemo(
    () => LANGUAGES.filter((l) => !QUICK_CODES.includes(l.code as (typeof QUICK_CODES)[number])),
    []
  );

  useEffect(() => {
    document.title = 'Choose language · Kalaloka';
    try {
      const code = localStorage.getItem(READING_LANG_KEY)?.trim() || '';
      setHasSavedLang(!!code);
      setSavedCode(code);
    } catch {
      setHasSavedLang(false);
      setSavedCode('');
    }
  }, []);

  const pick = (code: string) => {
    setReadingLang(code);
    router.replace(destination);
  };

  const continueSaved = () => {
    router.replace(destination);
  };

  const savedLabel = savedCode ? languageLabel(savedCode) : '';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-warm-50 via-white to-primary/5 dark:from-warm-950 dark:via-warm-900 dark:to-warm-950">
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 max-w-lg mx-auto w-full">
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/25 mb-5">
          <Sparkles className="w-7 h-7 text-white" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-primary mb-3">
          <Globe2 className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">Start here</span>
          {signingInAfter && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              Then sign in
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-center text-warm-900 dark:text-warm-50 mb-2">
          Read in the language you love
        </h1>
        <p className="text-sm text-warm-500 text-center mb-1 leading-relaxed max-w-md">
          Your home feed and discovery prioritize this language first. One tap to set it — change anytime from{' '}
          <span className="text-warm-700 dark:text-warm-300 font-medium">Feed language</span> in the sidebar.
        </p>
        {!signingInAfter && (
          <p className="text-xs text-warm-400 text-center mb-6 max-w-sm flex items-start justify-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>No account needed to browse. Sign in when you want to write, message, or sync your library.</span>
          </p>
        )}
        {signingInAfter && (
          <p className="text-xs text-warm-400 text-center mb-6 max-w-sm">
            We ask for language before your phone number so your first screen after sign-in already feels like home.
          </p>
        )}

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full border bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300">
            <Flag className="w-3 h-3" />
            Startup India
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full border bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-300">
            <MapPin className="w-3 h-3" />
            Made in Karnataka
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full border bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300">
            <Shield className="w-3 h-3" />
            Secure & Private
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full border bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-300">
            <Languages className="w-3 h-3" />
            11+ Languages
          </span>
        </div>

        {hasSavedLang && savedLabel && (
          <div className="w-full mb-5 rounded-xl border border-primary/25 bg-primary/5 dark:bg-primary/10 px-4 py-3">
            <p className="text-xs font-medium text-warm-600 dark:text-warm-400 mb-2">Currently saved</p>
            <p className="text-sm font-semibold text-warm-900 dark:text-warm-100">{savedLabel}</p>
            <button
              type="button"
              onClick={continueSaved}
              className="mt-2 text-sm text-primary font-semibold hover:underline"
            >
              {signingInAfter ? 'Continue to sign in with this' : 'Continue with this language'}
            </button>
          </div>
        )}

        <p className="w-full text-left text-xs font-semibold text-warm-500 uppercase tracking-wide mb-2">
          Popular picks
        </p>
        <div className="w-full grid grid-cols-1 gap-2.5">
          {quickLangs.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => pick(lang.code)}
              className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-900 text-left hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group"
            >
              <div>
                <p className="font-semibold text-warm-900 dark:text-warm-100 text-base leading-tight">
                  {lang.native}
                </p>
                <p className="text-xs text-warm-500 mt-0.5">{lang.name}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-warm-300 group-hover:text-primary flex-shrink-0 transition-colors" />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowAllLangs((v) => !v)}
          className="mt-4 flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline w-full py-2"
        >
          {showAllLangs ? (
            <>
              Show fewer <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              More languages ({moreLangs.length}) <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>

        {showAllLangs && (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
            {moreLangs.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => pick(lang.code)}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-warm-200 dark:border-warm-700 bg-white/80 dark:bg-warm-900/80 text-left hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group"
              >
                <div>
                  <p className="font-semibold text-warm-900 dark:text-warm-100 text-sm leading-tight">
                    {lang.native}
                  </p>
                  <p className="text-[11px] text-warm-500 mt-0.5">{lang.name}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-warm-300 group-hover:text-primary flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-warm-400">
          Already use Kalaloka?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-warm-50 dark:bg-warm-950 text-warm-500 text-sm">
          Loading…
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
