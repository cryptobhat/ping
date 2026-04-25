import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6 space-y-6 pb-28 lg:pb-6">
      {/* Cover */}
      <Skeleton className="aspect-[2/1] w-full rounded-2xl" />
      {/* Title block */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4 rounded" />
        <Skeleton className="h-5 w-1/2 rounded" />
      </div>
      {/* Author row */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-11 h-11 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
      </div>
      {/* Body */}
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full rounded" />
        ))}
        <Skeleton className="h-4 w-2/3 rounded" />
      </div>
    </div>
  );
}
