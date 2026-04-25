import { Skeleton, ContentCardSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="pb-8">
      <Skeleton className="h-32 sm:h-44 lg:h-56 xl:h-64 rounded-none" />
      <div className="max-w-5xl mx-auto px-4 lg:px-8">
        <div className="-mt-12 sm:-mt-16 flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
          <Skeleton className="w-20 h-20 sm:w-28 sm:h-28 rounded-full" />
          <div className="flex-1 space-y-2 pb-1">
            <Skeleton className="h-7 w-48 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
        </div>
        <div className="flex gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <ContentCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
