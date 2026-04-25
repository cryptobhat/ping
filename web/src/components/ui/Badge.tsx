'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'story' | 'poem' | 'article';
  size?: 'sm' | 'md';
  className?: string;
  onClick?: () => void;
}

const badgeVariants = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-300',
  success: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
  // Content-type badges use bg-50 + text-700 (light) / bg-950/40 + text-300 (dark)
  // to stay legible without competing with the primary teal CTA color.
  story: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300',
  poem: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
  article: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
};

export function Badge({ children, variant = 'secondary', size = 'sm', className, onClick, 'aria-label': ariaLabel }: BadgeProps & { 'aria-label'?: string }) {
  return (
    <span
      onClick={onClick}
      role={onClick ? 'button' : 'status'}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        badgeVariants[variant],
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </span>
  );
}
