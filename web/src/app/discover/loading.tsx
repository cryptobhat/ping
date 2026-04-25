import { ContentCardSkeleton, BookCardSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="py-4 lg:py-6 space-y-8">
      <div className="px-4 lg:px-8">
        <div className="skeleton h-12 rounded-2xl max-w-2xl mx-auto" />
      </div>
      <div className="px-4 lg:px-8">
        <div className="skeleton h-6 w-40 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[3/2] rounded-xl" />
          ))}
        </div>
      </div>
      <div className="px-4 lg:px-8">
        <div className="skeleton h-6 w-40 rounded mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      </div>
      <div className="px-4 lg:px-8">
        <div className="skeleton h-6 w-40 rounded mb-4" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ContentCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
