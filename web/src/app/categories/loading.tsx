import { Skeleton, ContentCardSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="py-4 lg:py-6 px-4 lg:px-8 space-y-6 pb-28 lg:pb-6">
      {/* Title */}
      <Skeleton className="h-8 w-48 rounded-lg" />
      {/* Pill row */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-xl flex-shrink-0" />
        ))}
      </div>
      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ContentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
