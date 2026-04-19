'use client';

import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="relative mb-5">
        <div className="w-18 h-18 rounded-2xl bg-warm-50 dark:bg-warm-800/60 flex items-center justify-center">
          <Icon className="w-8 h-8 text-warm-300 dark:text-warm-600" />
        </div>
        <div className="absolute -inset-3 rounded-3xl bg-warm-100/40 dark:bg-warm-800/20 -z-10" />
      </div>
      <h3 className="text-base font-semibold text-warm-700 dark:text-warm-300 mb-1.5">{title}</h3>
      <p className="text-sm text-warm-400 dark:text-warm-500 max-w-[280px] leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-5">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
