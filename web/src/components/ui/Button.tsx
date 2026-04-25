'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  /**
   * Button size. Touch-target guidance:
   * - `xs` (32px) — dense desktop UI only (badge actions, kebab menus). Do NOT
   *   use for primary touch targets; below WCAG-comfortable 40px minimum.
   * - `sm` (40px) — compact actions on mobile/desktop, comfortable touch target.
   * - `md` (44px) — default; meets Apple HIG / WCAG 2.5.5 touch target.
   * - `lg` (48px) — primary CTAs, form submits.
   */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variants = {
  primary: 'gradient-primary text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-warm-950',
  secondary: 'bg-warm-100 dark:bg-warm-800 text-warm-900 dark:text-warm-100 hover:bg-warm-200 dark:hover:bg-warm-700 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-warm-400/50 focus-visible:ring-offset-2',
  ghost: 'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-warm-400/50',
  outline: 'border border-warm-200 dark:border-warm-700 text-warm-700 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-800 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:ring-offset-2',
};

const sizeStyles = {
  xs: 'px-2.5 py-1 text-xs rounded-lg gap-1 min-h-[32px]',
  sm: 'px-3.5 py-2 text-sm rounded-lg gap-1.5 min-h-[40px]',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2 min-h-[44px]',
  lg: 'px-6 py-3 text-base rounded-xl gap-2 min-h-[48px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, icon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 outline-none select-none',
          variants[variant],
          sizeStyles[size],
          (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
