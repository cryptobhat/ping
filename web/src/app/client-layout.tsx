'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { TopBar } from '@/components/layout/TopBar';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/theme';
import { getReadingLang } from '@/lib/reading-lang';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';
import { AdSenseScript } from '@/components/ads/AdSenseScript';
import { AdSenseSlot } from '@/components/ads/AdSenseSlot';
import { SmartAppBanner } from '@/components/SmartAppBanner';
import { notificationApi } from '@/lib/api';
import dynamic from 'next/dynamic';

const SubscriptionModal = dynamic(
  () => import('@/components/SubscriptionModal').then(m => ({ default: m.SubscriptionModal })),
  { ssr: false }
);

const authRoutes = ['/login', '/register'];
const publicNoShellRoutes = ['/welcome', ...authRoutes];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [i18nReady, setI18nReady] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);
  const { initialize, isAuthenticated } = useAuthStore();
  const { setMode } = useThemeStore();
  const isPublicNoShell = publicNoShellRoutes.includes(pathname);
  const isChatConversation = /^\/chat\/[^/]+$/.test(pathname);
  const lastUnreadCountRef = useRef<number>(0);
  const notifIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    initialize();
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setMode(true);
    }
    // Detect Capacitor native app
    const ua = navigator.userAgent || '';
    if (ua.includes('KalalokaApp') || (window as any).Capacitor?.isNativePlatform?.()) {
      setIsNativeApp(true);
      document.documentElement.classList.add('native-app');
    }
  }, []);

  useEffect(() => {
    setI18nReady(true);
  }, []);

  useEffect(() => {
    if (!i18nReady || isPublicNoShell) return;
    if (!getReadingLang()) {
      router.replace('/welcome');
    }
  }, [i18nReady, pathname, isPublicNoShell, router]);

  // --- Browser Notification Permission + Polling ---
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const checkUnreadNotifications = useCallback(async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      const count = res.data?.data?.count ?? res.data?.count ?? 0;
      if (count > lastUnreadCountRef.current && lastUnreadCountRef.current >= 0) {
        const diff = count - lastUnreadCountRef.current;
        if (diff > 0 && Notification.permission === 'granted' && document.hidden) {
          new Notification('Kalaloka', {
            body: `You have ${diff} new notification${diff > 1 ? 's' : ''}`,
            icon: '/icons/icon-192.png',
            tag: 'kalaloka-unread',
          });
        }
      }
      lastUnreadCountRef.current = count;
    } catch {
      // Silently fail — user may not be logged in
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    requestNotificationPermission();

    // Only poll while the tab is visible. Background tabs aggressively throttle
    // setInterval anyway, but explicitly stopping avoids needless network/CPU
    // and battery drain on mobile.
    const startPolling = () => {
      if (notifIntervalRef.current) return;
      checkUnreadNotifications();
      notifIntervalRef.current = setInterval(checkUnreadNotifications, 60000);
    };
    const stopPolling = () => {
      if (notifIntervalRef.current) {
        clearInterval(notifIntervalRef.current);
        notifIntervalRef.current = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') startPolling();
      else stopPolling();
    };

    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      startPolling();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isAuthenticated, requestNotificationPermission, checkUnreadNotifications]);

  if (isPublicNoShell) {
    return (
      <PostHogProvider>
        <Toaster position="top-center" toastOptions={{ className: 'text-sm' }} />
        {children}
      </PostHogProvider>
    );
  }

  return (
    <PostHogProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-white focus:px-3 focus:py-2 focus:rounded"
      >
        Skip to content
      </a>
      {!isNativeApp && <SmartAppBanner />}
      {!isNativeApp && <AdSenseScript />}
      <Toaster position="top-center" toastOptions={{ className: 'text-sm' }} />
      {!isNativeApp && <Sidebar />}
      {!isChatConversation && <TopBar />}
      <main id="main-content" className={cn(
        'min-h-screen',
        !isNativeApp && 'lg:ml-[260px]',
        isChatConversation ? 'pb-0' : isNativeApp ? 'pb-16' : 'pb-24 lg:pb-0'
      )}>
        <div className={isChatConversation ? '' : 'max-w-5xl mx-auto'}>
          {children}
          {!isChatConversation && !isNativeApp && (
            <div className="px-4 lg:px-6 pb-6 pt-2">
              <AdSenseSlot />
            </div>
          )}
        </div>
      </main>
      {!isChatConversation && <MobileNav />}
      <SubscriptionModal />
    </PostHogProvider>
  );
}
