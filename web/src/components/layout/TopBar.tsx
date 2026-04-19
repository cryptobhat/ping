'use client';

import Link from 'next/link';
import { Bell, MessageCircle, Search, Sparkles, User, Settings, Wallet, LogOut, Star, Trophy } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Avatar } from '@/components/ui/Avatar';
import { useState } from 'react';

export function TopBar() {
  const { user, isAuthenticated } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-warm-950/90 backdrop-blur-xl border-b border-warm-200/50 dark:border-warm-800/50 lg:hidden">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-warm-900 dark:text-warm-50 truncate max-w-[120px]">Kalaloka</span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <Link href="/search" className="flex items-center justify-center w-11 h-11 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-xl transition-colors">
            <Search className="w-5 h-5 text-warm-600 dark:text-warm-400" />
          </Link>
          <Link href="/notifications" className="flex items-center justify-center w-11 h-11 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-xl transition-colors relative">
            <Bell className="w-5 h-5 text-warm-600 dark:text-warm-400" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-white dark:ring-warm-950" />
          </Link>
          <Link href="/chat" className="flex items-center justify-center w-11 h-11 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-xl transition-colors">
            <MessageCircle className="w-5 h-5 text-warm-600 dark:text-warm-400" />
          </Link>
          {isAuthenticated && user ? (
            <div className="relative ml-1">
              <button onClick={() => setShowMenu(!showMenu)} className="rounded-full">
                <Avatar src={user.profileImage} name={user.name} size="xs" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-white dark:bg-warm-900 rounded-2xl shadow-xl border border-warm-100 dark:border-warm-800 py-2 animate-scale-in">
                    {/* User info */}
                    <div className="px-4 py-2 border-b border-warm-100 dark:border-warm-800 mb-1">
                      <p className="text-sm font-semibold text-warm-900 dark:text-warm-100 truncate">{user.name}</p>
                      <p className="text-xs text-warm-500 truncate">@{user.username}</p>
                    </div>
                    {([
                      { href: '/profile', icon: User, label: 'Profile' },
                      { href: '/settings', icon: Settings, label: 'Settings' },
                      { href: '/wallet', icon: Wallet, label: 'Wallet' },
                      { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
                      { href: '/live', icon: Trophy, label: 'Live Rooms' },
                      { href: '/subscription', icon: Star, label: 'Premium' },
                    ] as const).map(({ href, icon: Icon, label }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-warm-700 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
                      >
                        <Icon className="w-4 h-4 text-warm-400" />
                        {label}
                      </Link>
                    ))}
                    <div className="h-px bg-warm-100 dark:bg-warm-800 my-1" />
                    <button
                      onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/login" className="ml-1 flex items-center justify-center w-11 h-11 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-xl transition-colors">
              <User className="w-5 h-5 text-warm-600 dark:text-warm-400" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
