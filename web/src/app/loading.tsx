import { ContentCardSkeleton, BookCardSkeleton } from '@/components/ui/Skeleton';

// Streamed UI while the home feed is fetching — matches /app/page.tsx layout.
export default function Loading() {
  return (
    <div className="py-4 lg:py-6 space-y-8 lg:space-y-10 pb-28 lg:pb-6">
      {/* Hero banner skeleton */}
      <div className="px-4 lg:px-6">
        <div className="skeleton h-[180px] lg:h-[220px] rounded-2xl" />
      </div>
      {/* Horizontal book row skeleton */}
      <div className="px-4 lg:px-6 space-y-3">
        <div className="skeleton h-5 w-40 rounded" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      </div>
      {/* Feed skeleton */}
      <div className="px-4 lg:px-6 space-y-4">
        <div className="skeleton h-5 w-36 rounded" />
        {Array.from({ length: 6 }).map((_, i) => (
          <ContentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
