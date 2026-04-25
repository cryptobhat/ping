'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, BookOpen, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/discover', icon: Compass, label: 'Discover' },
  { href: '/library', icon: BookOpen, label: 'Library' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-warm-900/95 backdrop-blur-xl border-t border-warm-200 dark:border-warm-800 z-40 lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} aria-label="Mobile navigation">
      <div className="flex items-center justify-around px-2 py-1.5">
        {tabs.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={isActive(href) ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center px-3 rounded-xl transition-all duration-200',
              isActive(href) && 'bg-primary/5'
            )}
          >
            <Icon
              className={cn(
                'w-5 h-5 transition-colors',
                isActive(href) ? 'text-primary' : 'text-warm-400'
              )}
            />
            <span
              className={cn(
                'text-[10px] font-medium transition-colors',
                isActive(href) ? 'text-primary' : 'text-warm-400'
              )}
            >
              {label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
