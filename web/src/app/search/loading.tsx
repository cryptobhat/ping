import { Skeleton, ContentCardSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="py-4 lg:py-6 px-4 lg:px-6 space-y-6 pb-28 lg:pb-6">
      {/* Search input shimmer */}
      <Skeleton className="h-12 rounded-2xl max-w-2xl mx-auto" />
      {/* Filters */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-full" />
        ))}
      </div>
      {/* Results */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ContentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
