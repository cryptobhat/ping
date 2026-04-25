'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FileQuestion } from 'lucide-react';
import { getReadingLang } from '@/lib/reading-lang';
import { t } from '@/lib/copy';

export default function NotFound() {
  // Reading lang is client-only (localStorage / cookie). Default to en for the
  // first paint, then upgrade once we know the user's pick.
  const [lang, setLang] = useState('en');
  useEffect(() => { setLang(getReadingLang() || 'en'); }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="w-24 h-24 rounded-full bg-warm-100 dark:bg-warm-800 flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-12 h-12 text-warm-400 dark:text-warm-500" />
        </div>
        <h1 className="text-6xl font-black text-warm-200 dark:text-warm-700 mb-2">404</h1>
        <h2 className="text-xl font-bold text-warm-900 dark:text-warm-100 mb-2">{t('notFound404', lang)}</h2>
        <p className="text-warm-500 mb-8 text-sm leading-relaxed">
          {t('notFoundSub', lang)}
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            {t('goHome', lang)}
          </Link>
          <Link
            href="/discover"
            className="px-5 py-2.5 bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300 rounded-xl text-sm font-semibold hover:bg-warm-200 dark:hover:bg-warm-700 transition-colors"
          >
            {t('discoverStories', lang)}
          </Link>
        </div>
      </div>
    </div>
  );
}
