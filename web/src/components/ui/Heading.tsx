import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/**
 * `Heading` — typographic primitive for page/section headings.
 *
 * `level` controls visual size (1 → 4). `as` lets you override the rendered
 * tag for semantic HTML (e.g. visually a level-3 but structurally an `<h2>`).
 *
 * Visual scale (mobile → desktop):
 *   1: text-3xl → text-4xl   (page titles)
 *   2: text-2xl → text-3xl   (major sections)
 *   3: text-xl  → text-2xl   (subsections)
 *   4: text-base → text-lg   (small headings, card titles)
 *
 * @example
 *   <Heading level={1}>Discover</Heading>
 *   <Heading level={3} as="h2">Categories</Heading>
 */
export interface HeadingProps {
  children: ReactNode;
  level: 1 | 2 | 3 | 4;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'div';
  id?: string;
}

const levelStyles = {
  1: 'text-3xl lg:text-4xl font-bold tracking-tight',
  2: 'text-2xl lg:text-3xl font-bold tracking-tight',
  3: 'text-xl lg:text-2xl font-semibold',
  4: 'text-base lg:text-lg font-semibold',
};

export function Heading({ children, level, className, as, id }: HeadingProps) {
  const Tag = (as ?? (`h${level}` as const));
  return (
    <Tag
      id={id}
      className={cn(
        'text-warm-900 dark:text-warm-50',
        levelStyles[level],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
