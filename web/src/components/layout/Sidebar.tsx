'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Home, Compass, PenTool, BookOpen, User, MessageCircle, Bell,
  Wallet, Settings, Trophy, Star, LogOut, Moon, Sun, Sparkles, Library, Globe2, Radio, ChevronDown,
  Coins, Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { Avatar } from '@/components/ui/Avatar';
import { getReadingLang, setReadingLang, languageLabel } from '@/lib/reading-lang';

const mainNav = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/discover', icon: Compass, label: 'Discover' },
  { href: '/series', icon: Library, label: 'Series' },
  { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { href: '/create', icon: PenTool, label: 'Write' },
  { href: '/library', icon: BookOpen, label: 'Library' },
  { href: '/live', icon: Radio, label: 'Live' },
  { href: '/chat', icon: MessageCircle, label: 'Messages' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
];

const secondaryNav = [
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/rewards', icon: Coins, label: 'Rewards' },
  { href: '/favorites', icon: Heart, label: 'Favorites' },
  { href: '/competitions', icon: Trophy, label: 'Competitions' },
  { href: '/subscription', icon: Star, label: 'Premium' },
];

const sidebarLanguages = [
  { code: 'kn', name: 'ಕನ್ನಡ' },
  { code: 'hi', name: 'हिंदी' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const [feedLangLine, setFeedLangLine] = useState('');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('');
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const langListboxRef = useRef<HTMLUListElement>(null);
  const [langActiveIdx, setLangActiveIdx] = useState(0);

  useEffect(() => {
    const code = getReadingLang();
    setFeedLangLine(code ? languageLabel(code) : 'Not set yet');
    setCurrentLang(code || 'kn');
  }, [pathname]);

  // Click-outside + Escape handler for language dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLangDropdownOpen(false);
    }
    if (langDropdownOpen) {
      // Sync the active option with the currently-selected language each time
      // the listbox opens so arrow-key navigation starts from the right item.
      const idx = sidebarLanguages.findIndex(l => l.code === currentLang);
      setLangActiveIdx(idx >= 0 ? idx : 0);
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKey);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKey);
      };
    }
  }, [langDropdownOpen, currentLang]);

  const switchLang = (code: string) => {
    setReadingLang(code);
    setCurrentLang(code);
    setLangDropdownOpen(false);
    window.location.reload();
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-white dark:bg-warm-900 border-r border-warm-200 dark:border-warm-800 flex flex-col z-40 hidden lg:flex">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-warm-100 dark:border-warm-800">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-warm-900 dark:text-warm-50 tracking-tight">Kalaloka</h1>
            <p className="text-[10px] text-warm-500 -mt-0.5 tracking-wide">Write. Read. Connect.</p>
          </div>
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-hide">
        <div className="space-y-0.5">
          {mainNav.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1',
                isActive(href)
                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                  : 'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800 hover:text-warm-900 dark:hover:text-warm-100'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive(href) && 'text-primary')} />
              <span>{label}</span>
              {label === 'Notifications' && (
                <span className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
              )}
            </Link>
          ))}
        </div>

        {/* Write CTA */}
        <div className="my-4 px-2">
          <Link
            href="/create"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl gradient-primary text-white font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <PenTool className="w-4 h-4" />
            Start Writing
          </Link>
        </div>

        <div className="px-3 mt-2 relative" ref={langDropdownRef}>
          <button
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            aria-label="Reading language"
            aria-haspopup="listbox"
            aria-expanded={langDropdownOpen}
            aria-controls="sidebar-lang-listbox"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setLangDropdownOpen(true);
              }
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800 transition-all w-full"
          >
            <Globe2 className="w-5 h-5 flex-shrink-0" />
            <span className="min-w-0 text-left flex-1">
              <span className="block font-medium text-warm-700 dark:text-warm-300">Feed language</span>
              <span className="block text-[11px] text-warm-400 truncate" title={feedLangLine}>
                {feedLangLine}
              </span>
            </span>
            <ChevronDown className={cn('w-4 h-4 text-warm-400 transition-transform', langDropdownOpen && 'rotate-180')} />
          </button>
          {langDropdownOpen && (
            <ul
              id="sidebar-lang-listbox"
              ref={langListboxRef}
              role="listbox"
              aria-label="Reading language"
              tabIndex={-1}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setLangActiveIdx((i) => Math.min(i + 1, sidebarLanguages.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setLangActiveIdx((i) => Math.max(i - 1, 0));
                } else if (e.key === 'Home') {
                  e.preventDefault();
                  setLangActiveIdx(0);
                } else if (e.key === 'End') {
                  e.preventDefault();
                  setLangActiveIdx(sidebarLanguages.length - 1);
                } else if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  switchLang(sidebarLanguages[langActiveIdx].code);
                }
              }}
              className="absolute left-3 right-3 top-full mt-1 bg-white dark:bg-warm-900 rounded-xl border border-warm-200 dark:border-warm-700 shadow-lg py-1 z-50 outline-none"
            >
              {sidebarLanguages.map((lang, idx) => (
                <li
                  key={lang.code}
                  role="option"
                  aria-selected={currentLang === lang.code}
                  onMouseEnter={() => setLangActiveIdx(idx)}
                  onClick={() => switchLang(lang.code)}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer',
                    currentLang === lang.code
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-warm-700 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-800',
                    idx === langActiveIdx && currentLang !== lang.code && 'bg-warm-50 dark:bg-warm-800'
                  )}
                >
                  {lang.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Secondary Nav */}
        <div className="border-t border-warm-100 dark:border-warm-800 pt-3 mt-1">
          <p className="px-3 mb-1.5 text-[10px] font-semibold text-warm-400 uppercase tracking-widest">More</p>
          {secondaryNav.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1',
                isActive(href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-warm-500 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800 hover:text-warm-900 dark:hover:text-warm-100'
              )}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-warm-100 dark:border-warm-800 p-3 space-y-1">
        {/* Theme Toggle */}
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-warm-500 hover:bg-warm-100 dark:hover:bg-warm-800 w-full transition-colors"
        >
          {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors',
            isActive('/settings') ? 'bg-primary/10 text-primary' : 'text-warm-500 hover:bg-warm-100 dark:hover:bg-warm-800'
          )}
        >
          <Settings className="w-4.5 h-4.5" />
          <span>Settings</span>
        </Link>

        {/* User */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-warm-50 dark:bg-warm-800/50 mt-2">
            <Link href="/profile" className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar src={user.profileImage} name={user.name} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate text-warm-900 dark:text-warm-100">{user.name}</p>
                <p className="text-xs text-warm-500 truncate">@{user.username}</p>
              </div>
            </Link>
            <button onClick={logout} className="p-1.5 hover:bg-warm-200 dark:hover:bg-warm-700 rounded-lg transition-colors">
              <LogOut className="w-4 h-4 text-warm-400" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
