'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn, formatNumber } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Star, Eye, Heart, BookOpen } from 'lucide-react';

interface BookCardProps {
  item: any;
  type?: 'content' | 'series';
  size?: 'sm' | 'md';
  rank?: number; // For numbered ranking like Pratilipi
}

export function BookCard({ item, type = 'content', size = 'md', rank }: BookCardProps) {
  const [imgError, setImgError] = useState(false);
  const href = type === 'series' ? `/series/${item.id}` : `/content/${item.id}`;
  const title = item.title || item.name;
  const author = item.author?.name || '';
  const cover = item.coverImage;
  const rating = item.rating;
  const partsCount = item._count?.items || item.itemCount || item.partsCount || 0;
  const showCover = !!cover && !imgError;

  return (
    <Link href={href} className="group block flex-shrink-0" style={{ width: size === 'sm' ? 140 : 156 }}>
      <div className="relative overflow-hidden rounded-xl bg-warm-100 dark:bg-warm-800 aspect-[3/4] mb-2.5 shadow-sm group-hover:shadow-md transition-all duration-300">
        {showCover ? (
          <Image
            src={cover}
            alt={title}
            fill
            sizes={size === 'sm' ? '140px' : '156px'}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/80 via-primary-dark/70 to-accent/80 flex flex-col items-center justify-center p-4 gap-3">
            <BookOpen className="w-8 h-8 text-white/60" />
            <span className="text-center text-sm font-semibold text-white leading-tight line-clamp-3 drop-shadow">{title}</span>
          </div>
        )}
        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-10">
          {partsCount > 0 && (
            <div className="flex items-center gap-1 text-white/90 text-[10px]">
              <span className="bg-white/20 backdrop-blur-sm px-1.5 py-0.5 rounded">
                {partsCount} {type === 'series' ? 'chapters' : 'parts'}
              </span>
            </div>
          )}
        </div>
        {/* Rank badge - Pratilipi style (numbered, top-left) */}
        {rank && (
          <div className="absolute top-2 left-2 bg-primary text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg z-10">
            #{rank}
          </div>
        )}
        {/* Rating badge - Pratilipi style (green) */}
        {rating && (
          <div className={cn(
            "absolute flex items-center gap-0.5 bg-green-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded",
            rank ? "top-2 right-2" : "top-2 left-2"
          )}>
            <Star className="w-2.5 h-2.5 fill-white" />
            {rating}
          </div>
        )}
        {/* Premium badge */}
        {item.isPremium && (
          <div className={cn(
            "absolute bg-amber-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded",
            rank && rating ? "top-9 right-2" : "top-2 right-2"
          )}>
            PREMIUM
          </div>
        )}
      </div>
      <h4 className="text-sm font-semibold text-warm-900 dark:text-warm-100 line-clamp-2 group-hover:text-primary transition-colors leading-snug">{title}</h4>
      {author && <p className="text-xs text-warm-500 mt-0.5 truncate leading-none">{author}</p>}
      {/* Stats row */}
      <div className="flex items-center gap-2 mt-1 text-[10px] text-warm-400">
        {item.viewsCount && (
          <span className="flex items-center gap-0.5">
            <Eye className="w-2.5 h-2.5" /> {formatNumber(item.viewsCount)}
          </span>
        )}
        {(item.likesCount || item._count?.likes) && (
          <span className="flex items-center gap-0.5">
            <Heart className="w-2.5 h-2.5" /> {formatNumber(item.likesCount || item._count?.likes)}
          </span>
        )}
      </div>
    </Link>
  );
}
