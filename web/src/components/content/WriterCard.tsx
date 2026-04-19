'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { formatNumber } from '@/lib/utils';

interface WriterCardProps {
  writer: any;
}

export const WriterCard = React.memo(function WriterCard({ writer }: WriterCardProps) {
  return (
    <Link
      href={`/user/${writer.username}`}
      className="flex flex-col items-center gap-2 flex-shrink-0 group w-20 sm:w-24 py-1"
    >
      <Avatar src={writer.profileImage} name={writer.name} size="lg" border />
      <div className="text-center w-full">
        <p className="text-xs font-medium text-warm-800 dark:text-warm-200 truncate w-full group-hover:text-primary transition-colors">{writer.name?.split(' ')[0]}</p>
        <p className="text-[10px] text-warm-400">{formatNumber(writer.followersCount || 0)} fans</p>
      </div>
    </Link>
  );
});
