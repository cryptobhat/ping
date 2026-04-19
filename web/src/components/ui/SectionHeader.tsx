'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  actionLabel?: string;
}

export function SectionHeader({ title, subtitle, href, actionLabel = 'See All' }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-lg lg:text-xl font-bold text-warm-900 dark:text-warm-50">{title}</h2>
        {subtitle && <p className="text-xs text-warm-500 mt-0.5">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary-dark transition-colors"
        >
          {actionLabel}
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}
