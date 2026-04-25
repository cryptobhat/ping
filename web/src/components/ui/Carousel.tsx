'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarouselProps {
  items: any[];
  autoPlay?: boolean;
  interval?: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  className?: string;
  /** Accessible label for the carousel region. Defaults to "Carousel". */
  ariaLabel?: string;
}

export function Carousel({ items, autoPlay = true, interval = 4000, renderItem, className, ariaLabel = 'Carousel' }: CarouselProps) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length);
    }, interval);
    return () => clearInterval(timerRef.current);
  }, [autoPlay, interval, items.length]);

  const go = (dir: 'prev' | 'next') => {
    clearInterval(timerRef.current);
    setCurrent((prev) =>
      dir === 'next' ? (prev + 1) % items.length : (prev - 1 + items.length) % items.length
    );
  };

  if (!items.length) return null;

  return (
    <div
      className={cn('relative group', className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); go('prev'); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); go('next'); }
      }}
    >
      {/* Slides — aria-live so SR users hear when the slide changes. */}
      <div className="overflow-hidden rounded-2xl" aria-live="polite">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              className="w-full flex-shrink-0"
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${i + 1} of ${items.length}`}
              aria-hidden={i !== current}
            >
              {renderItem(item, i)}
            </div>
          ))}
        </div>
      </div>

      {/* Arrows — visible by default below lg, hover-revealed on lg+. */}
      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go('prev')}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-warm-900/90 shadow-lg flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity hover:bg-white"
          >
            <ChevronLeft className="w-4 h-4 text-warm-700" />
          </button>
          <button
            type="button"
            onClick={() => go('next')}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-warm-900/90 shadow-lg flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity hover:bg-white"
          >
            <ChevronRight className="w-4 h-4 text-warm-700" />
          </button>
        </>
      )}

      {/* Dots */}
      {items.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === current ? 'true' : undefined}
              onClick={() => { clearInterval(timerRef.current); setCurrent(i); }}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Horizontal scroll container with arrows
interface HScrollProps {
  children: React.ReactNode;
  className?: string;
}

export function HScroll({ children, className }: HScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const checkScroll = () => {
    if (!ref.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = ref.current;
    setCanLeft(scrollLeft > 10);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => { checkScroll(); }, [children]);

  const scroll = (dir: 'left' | 'right') => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  return (
    <div className="relative group">
      <div
        ref={ref}
        onScroll={checkScroll}
        className={cn('flex gap-4 overflow-x-auto scrollbar-hide pb-2', className)}
      >
        {children}
      </div>
      {canLeft && (
        <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-9 h-9 rounded-full bg-white dark:bg-warm-900 shadow-lg border border-warm-100 dark:border-warm-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <ChevronLeft className="w-4 h-4 text-warm-600" />
        </button>
      )}
      {canRight && (
        <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-9 h-9 rounded-full bg-white dark:bg-warm-900 shadow-lg border border-warm-100 dark:border-warm-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <ChevronRight className="w-4 h-4 text-warm-600" />
        </button>
      )}
    </div>
  );
}
