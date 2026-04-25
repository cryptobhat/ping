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

// Deterministic gradient based on name — each user gets a consistent color
const gradients = [
  'from-rose-400 to-pink-500',
  'from-violet-400 to-purple-500',
  'from-blue-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-cyan-400 to-blue-500',
  'from-fuchsia-400 to-pink-500',
  'from-teal-400 to-emerald-500',
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
      title={name}
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
