'use client';

import { useState } from 'react';
import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  border?: boolean;
}

const sizes = {
  xs: 'w-8 h-8 text-xs',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-32 h-32 text-3xl',
};

// Deterministic gradient based on name — each user gets a consistent color.
// Reduced from 8 saturated combos to 4 muted brand-aligned gradients so
// avatars don't compete with primary teal across feed surfaces.
const gradients = [
  'from-primary/40 to-accent/40',     // brand teal/saffron
  'from-warm-300 to-warm-500',         // neutral
  'from-amber-300 to-orange-400',      // warm sunset
  'from-emerald-300 to-teal-400',      // cool green
];

function nameToGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

export function Avatar({ src, name, size = 'md', className, border }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showImg = !!src && !imgError;

  return (
    <div
      className={cn(
        'rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-semibold select-none',
        sizes[size],
        border && 'ring-2 ring-primary/20 ring-offset-1 ring-offset-white dark:ring-offset-warm-900',
        !showImg && `bg-gradient-to-br ${nameToGradient(name || '?')} text-white`,
        className
      )}
    >
      {showImg ? (
        <img
          src={src!}
          alt={`${name}'s avatar`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <span aria-label={`${name}'s initials`}>{getInitials(name || '?')}</span>
      )}
    </div>
  );
}
