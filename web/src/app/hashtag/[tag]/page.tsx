'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { hashtagApi } from '@/lib/api';
import { getReadingLang } from '@/lib/reading-lang';
import { ContentCard } from '@/components/content/ContentCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ContentCardSkeleton } from '@/components/ui/Skeleton';
import { Hash, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function HashtagPage() {
  const { tag } = useParams();
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [tag]);

  const loadContent = async () => {
    try {
      const { data } = await hashtagApi.getContent(tag as string, { page: 1, limit: 20, language: getReadingLang() || undefined });
      setContent(data?.data || data || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 lg:px-6 py-6">
      <Link href="/discover" className="inline-flex items-center gap-1 text-sm text-warm-500 hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Discover
      </Link>
      <div className="flex items-center gap-2 mb-6">
        <Hash className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50">{decodeURIComponent(tag as string)}</h1>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <ContentCardSkeleton key={i} />)}</div>
      ) : content.length === 0 ? (
        <EmptyState icon={Hash} title="No content" description="No content with this hashtag yet" />
      ) : (
        <div className="space-y-4">
          {content.map((item: any) => <ContentCard key={item.id} content={item.content || item} />)}
        </div>
      )}
    </div>
  );
}
