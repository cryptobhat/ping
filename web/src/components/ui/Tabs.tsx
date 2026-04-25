'use client';

import { cn } from '@/lib/utils';
import { useCallback, useRef, type KeyboardEvent, type ReactNode } from 'react';

/**
 * `Tabs` — accessible tab strip with pill or underline styling.
 *
 * Uses ARIA `tablist` / `tab` roles. Left/Right (and Home/End) arrow keys
 * cycle the focused tab and trigger `onChange`. The active tab gets
 * `tabindex={0}`; the rest get `tabindex={-1}` (roving tabindex pattern).
 *
 * @example
 *   <Tabs
 *     ariaLabel="Profile content"
 *     activeId={tab}
 *     onChange={setTab}
 *     tabs={[
 *       { id: 'stories', label: 'Stories', icon: <BookOpen className="w-4 h-4" /> },
 *       { id: 'poems', label: 'Poems' },
 *       { id: 'drafts', label: 'Drafts', count: 3 },
 *     ]}
 *   />
 */
export interface TabsTab {
  id: string;
  label: string;
  count?: number;
  icon?: ReactNode;
}

export interface TabsProps {
  tabs: TabsTab[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: 'pill' | 'underline';
  className?: string;
  ariaLabel?: string;
}

export function Tabs({
  tabs,
  activeId,
  onChange,
  variant = 'pill',
  className,
  ariaLabel,
}: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
      const len = tabs.length;
      let next = idx;
      if (e.key === 'ArrowRight') next = (idx + 1) % len;
      else if (e.key === 'ArrowLeft') next = (idx - 1 + len) % len;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = len - 1;
      else return;
      e.preventDefault();
      onChange(tabs[next].id);
      const btn = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next];
      btn?.focus();
    },
    [tabs, onChange],
  );

  const isPill = variant === 'pill';

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'flex gap-2 overflow-x-auto scrollbar-hide',
        !isPill && 'gap-0.5 border-b border-warm-100 dark:border-warm-800',
        className,
      )}
    >
      {tabs.map((tab, idx) => {
        const selected = tab.id === activeId;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={selected}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap font-medium transition-all flex-shrink-0 min-h-[44px]',
              isPill
                ? cn(
                    'px-4 py-2.5 rounded-xl text-sm',
                    selected
                      ? 'bg-primary text-white shadow-sm shadow-primary/20'
                      : 'bg-warm-50 dark:bg-warm-800/50 text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800',
                  )
                : cn(
                    'px-4 sm:px-5 py-3 text-sm border-b-2',
                    selected
                      ? 'border-primary text-primary'
                      : 'border-transparent text-warm-500 hover:text-warm-700 dark:hover:text-warm-300',
                  ),
            )}
          >
            {tab.icon}
            {tab.label}
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'ml-0.5 text-[10px] font-semibold rounded-full px-1.5 py-0.5',
                  selected && isPill
                    ? 'bg-white/20 text-white'
                    : 'bg-warm-200/70 dark:bg-warm-700/70 text-warm-700 dark:text-warm-300',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
