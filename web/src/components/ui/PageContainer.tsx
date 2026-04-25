import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/**
 * `PageContainer` — page-level layout wrapper.
 *
 * Encapsulates the repeated `mx-auto px-4 lg:px-6 py-6 max-w-*` pattern.
 * Default size is `'lg'` (max-w-7xl). Use `noVerticalPadding` for pages that
 * own their own top/bottom rhythm (e.g. profile cover bleed).
 *
 * @example
 *   <PageContainer>
 *     <h1>Discover</h1>
 *   </PageContainer>
 *
 *   // narrow article-style content
 *   <PageContainer size="sm">{children}</PageContainer>
 *
 *   // edge-to-edge cover, vertical padding owned internally
 *   <PageContainer size="full" noVerticalPadding>{children}</PageContainer>
 */
export interface PageContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  noVerticalPadding?: boolean;
  as?: 'div' | 'main' | 'section' | 'article';
}

const sizeMap = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[88rem]',
  full: '',
};

export function PageContainer({
  children,
  className,
  size = 'lg',
  noVerticalPadding = false,
  as: Tag = 'div',
}: PageContainerProps) {
  return (
    <Tag
      className={cn(
        'mx-auto w-full px-4 lg:px-6',
        sizeMap[size],
        !noVerticalPadding && 'py-6 lg:py-8',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
