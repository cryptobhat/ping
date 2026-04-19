'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { categoryApi } from '@/lib/api';
import { getReadingLang } from '@/lib/reading-lang';
import { ContentCard } from '@/components/content/ContentCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ContentCardSkeleton } from '@/components/ui/Skeleton';
import { FolderOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CategoryPage() {
  const { id } = useParams();
  const [category, setCategory] = useState<any>(null);
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [catRes, contentRes] = await Promise.allSettled([
        categoryApi.getById(id as string),
        categoryApi.getContent(id as string, { page: 1, limit: 20, language: getReadingLang() || undefined }),
      ]);
      if (catRes.status === 'fulfilled') setCategory(catRes.value.data?.data || catRes.value.data);
      if (contentRes.status === 'fulfilled') setContent(contentRes.value.data?.data || contentRes.value.data || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 lg:px-6 py-6">
      <Link href="/discover" className="inline-flex items-center gap-1 text-sm text-warm-500 hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Discover
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
          {category?.emoji || '📂'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50">{category?.name || 'Category'}</h1>
          {category?.description && <p className="text-sm text-warm-500">{category.description}</p>}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <ContentCardSkeleton key={i} />)}</div>
      ) : content.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No content" description="No content in this category yet" />
      ) : (
        <div className="space-y-4">
          {content.map((item: any) => <ContentCard key={item.id} content={item} />)}
        </div>
      )}
    </div>
  );
}
