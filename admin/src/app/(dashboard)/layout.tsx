'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/api';
import Sidebar from '@/components/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Verify session via server-side cookie check
    auth.checkSession().then((user) => {
      if (!user) {
        router.replace('/login');
      } else {
        setReady(true);
      }
    }).catch(() => {
      router.replace('/login');
    });
  }, [router]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleSidebarClose = useCallback(() => setSidebarOpen(false), []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />

      {/* Mobile top bar with hamburger */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500">
          <span className="text-xs font-bold text-white">K</span>
        </div>
        <span className="text-sm font-bold text-gray-900">Kalaloka Admin</span>
      </div>

      <main className="min-h-screen lg:ml-64 ml-0">
        <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">{children}</div>
      </main>
    </div>
  );
}
