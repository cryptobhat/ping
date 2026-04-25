'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * `Chip` — pill-shaped label for categories, hashtags, and filter selections.
 *
 * Renders as `<button>` (default), `<Link>` (when `href` is set), or `<span>`
 * (when neither). Use `active` for filter pills that are toggled on; pair with
 * `removable` + `onRemove` for "applied filter" chips with an `×` affordance.
 *
 * @example
 *   <Chip active onClick={() => setType('STORY')}>Stories</Chip>
 *   <Chip href={`/hashtag/${tag}`} icon={<Hash className="w-3.5 h-3.5" />}>{tag}</Chip>
 *   <Chip removable onRemove={() => clearFilter('genre')}>{label}</Chip>
 */
export interface ChipProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md';
  active?: boolean;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1 min-h-[32px]',
  md: 'px-4 py-2.5 text-sm gap-1.5 min-h-[40px]',
};

const variants = {
  default:
    'bg-warm-50 dark:bg-warm-800/50 text-warm-600 dark:text-warm-400 border border-transparent hover:bg-warm-100 dark:hover:bg-warm-800',
  primary: 'bg-primary text-white border border-transparent hover:bg-primary-dark shadow-sm shadow-primary/20',
  secondary:
    'bg-white dark:bg-warm-900 text-warm-700 dark:text-warm-300 border border-warm-200 dark:border-warm-800 hover:border-primary/30 hover:bg-primary/5',
  outline:
    'bg-transparent text-warm-700 dark:text-warm-300 border border-warm-300 dark:border-warm-700 hover:border-primary/40',
};

const activeStyles =
  'bg-primary/10 text-primary border-primary/30 hover:bg-primary/15 dark:bg-primary/20 dark:text-primary-light dark:border-primary/40';

export function Chip({
  children,
  variant = 'default',
  size = 'sm',
  active,
  onClick,
  href,
  icon,
  removable,
  onRemove,
  className,
  disabled,
  ariaLabel,
}: ChipProps) {
  const classes = cn(
    'inline-flex items-center font-medium rounded-full whitespace-nowrap transition-all duration-fast flex-shrink-0',
    sizes[size],
    active ? activeStyles : variants[variant],
    disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
    className,
  );

  const inner = (
    <>
      {icon}
      <span>{children}</span>
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove?.();
          }}
          aria-label="Remove"
          className="ml-1 -mr-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={active}
        aria-label={ariaLabel}
        className={classes}
      >
        {inner}
      </button>
    );
  }
  return (
    <span className={classes} aria-label={ariaLabel}>
      {inner}
    </span>
  );
}
