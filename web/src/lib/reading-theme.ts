/**
 * Reading theme tokens — single source of truth for the content reader's
 * background/foreground colors. Mirrors `theme.extend.colors.reading` in
 * `tailwind.config.ts` so we can use raw hex in inline gradients (where
 * Tailwind classes can't be composed safely) and Tailwind classes in JSX.
 *
 * Add a new theme by extending both this map and the Tailwind config.
 */
export const READING_THEME = {
  light: { bg: '#FAFAF8', fg: '#1F1B16', bgClass: 'bg-reading-light-bg', fgClass: 'text-reading-light-fg' },
  sepia: { bg: '#F4ECD8', fg: '#5B4636', bgClass: 'bg-reading-sepia-bg', fgClass: 'text-reading-sepia-fg' },
  dark: { bg: '#1A1A2E', fg: '#E8E1D4', bgClass: 'bg-reading-dark-bg', fgClass: 'text-reading-dark-fg' },
} as const;

export type ReadingThemeId = keyof typeof READING_THEME;
