'use client';

import { useState } from 'react';
import { BookOpen, Feather, FileText, type LucideIcon } from 'lucide-react';

interface FallbackImageProps {
  src: string;
  alt?: string;
  className?: string;
  fallbackIcon?: LucideIcon;
  fallbackIconClassName?: string;
  fallbackClassName?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Image component that renders a gradient placeholder with an icon
 * when the image source fails to load, instead of just hiding the image.
 */
export function FallbackImage({
  src,
  alt = '',
  className = 'w-full h-full object-cover',
  fallbackIcon: Icon = BookOpen,
  fallbackIconClassName = 'w-8 h-8 text-warm-300 dark:text-warm-500',
  fallbackClassName = 'w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center',
  loading = 'lazy',
}: FallbackImageProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={fallbackClassName}>
        <Icon className={fallbackIconClassName} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setError(true)}
    />
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
