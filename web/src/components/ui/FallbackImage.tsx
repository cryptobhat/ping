'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BookOpen, Feather, FileText, type LucideIcon } from 'lucide-react';

interface FallbackImageProps {
  src: string;
  alt?: string;
  className?: string;
  fallbackIcon?: LucideIcon;
  fallbackIconClassName?: string;
  fallbackClassName?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  sizes?: string;
}

/**
 * Image component that renders a gradient placeholder with an icon
 * when the image source fails to load.
 *
 * Migrated to next/image for AVIF/WebP, automatic sizing, lazy loading
 * (via the browser's intersection observer), and CDN cache. The wrapper
 * uses `fill` so callers can keep using utility classes on a sized parent
 * and just pass `className` for object-fit/scale styling — preserving the
 * existing API. `sizes` defaults to a sensible mobile-first guess.
 */
export function FallbackImage({
  src,
  alt = '',
  className = 'w-full h-full object-cover',
  fallbackIcon: Icon = BookOpen,
  fallbackIconClassName = 'w-8 h-8 text-warm-300 dark:text-warm-500',
  fallbackClassName = 'w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center',
  loading = 'lazy',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
}: FallbackImageProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className={fallbackClassName}>
        <Icon className={fallbackIconClassName} />
      </div>
    );
  }

  // `fill` needs a positioned ancestor. We render our own `relative` block
  // that fills its parent (matches the previous `<img className="w-full h-full">`
  // contract), so callers don't need to add `relative` everywhere.
  // `priority` and `loading` are mutually exclusive in next/image.
  const imageProps = priority
    ? ({ priority: true } as const)
    : ({ loading } as const);

  return (
    <span className="relative block w-full h-full">
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        onError={() => setError(true)}
        {...imageProps}
      />
    </span>
  );
}

/**
 * Returns the appropriate icon for a content type.
 */
export function getContentTypeIcon(contentType?: string): LucideIcon {
  switch (contentType?.toUpperCase()) {
    case 'POEM':
      return Feather;
    case 'ARTICLE':
      return FileText;
    default:
      return BookOpen;
  }
}
