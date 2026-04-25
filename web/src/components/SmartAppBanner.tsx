'use client';

import { useEffect, useState } from 'react';
import { X, Smartphone } from 'lucide-react';
import { getReadingLang } from '@/lib/reading-lang';
import { t } from '@/lib/copy';

export function SmartAppBanner() {
  const [show, setShow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [lang, setLang] = useState('en');

  useEffect(() => {
    setLang(getReadingLang() || 'en');
  }, []);

  useEffect(() => {
    // Don't show in native app (Capacitor)
    const isCapacitor =
      (window as any).Capacitor?.isNativePlatform?.() ||
      navigator.userAgent.includes('Capacitor');
    if (isCapacitor) return;

    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsMobile(mobile);

    if (mobile) {
      const dismissed = sessionStorage.getItem('app_banner_dismissed');
      if (!dismissed) setShow(true);
    }
  }, []);

  if (!show || !isMobile) return null;

  const appLink = `kalaloka://${window.location.pathname}`;
  const playStoreLink = 'https://play.google.com/store/apps/details?id=com.kavi.app';

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem('app_banner_dismissed', '1');
  };

  return (
    <div className="sticky top-0 z-50 flex items-center gap-3 px-4 py-2.5 bg-warm-900 text-white">
      <button onClick={dismiss} className="p-1" aria-label="Dismiss app banner">
        <X className="w-4 h-4 text-warm-400" />
      </button>
      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
        <Smartphone className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Kalaloka</p>
        <p className="text-[11px] text-warm-400">{t('appBannerValueProp', lang)}</p>
      </div>
      <a
        href={appLink}
        onClick={() => {
          // Try to open app first, fallback to Play Store after timeout
          setTimeout(() => {
            window.location.href = playStoreLink;
          }, 1500);
        }}
        className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
      >
        Open
      </a>
    </div>
  );
}
