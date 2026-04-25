'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { categoryApi } from '@/lib/api';
import { BookOpen, Tag } from 'lucide-react';
import { FallbackImage } from '@/components/ui/FallbackImage';

const GRADIENTS = [
  'from-rose-500 to-pink-600', 'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600', 'from-red-500 to-rose-600',
  'from-indigo-500 to-blue-600', 'from-fuchsia-500 to-pink-600', 'from-green-500 to-emerald-600',
  'from-sky-500 to-blue-600', 'from-yellow-500 to-amber-600', 'from-teal-500 to-cyan-600',
  'from-purple-500 to-violet-600', 'from-orange-500 to-red-600', 'from-cyan-500 to-sky-600',
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryApi.getAll().then(({ data }) => {
      setCategories(data?.data || data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="px-4 lg:px-6 py-6 pb-28 lg:pb-8">
        <div className="skeleton h-8 w-48 rounded-lg mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(12)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6 py-6 pb-28 lg:pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Tag className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50">Categories</h1>
          <p className="text-sm text-warm-500">Browse stories by genre</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {categories.filter((c: any) => c.isActive !== false).map((cat: any, i: number) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug || cat.id}`}
            className="group relative overflow-hidden rounded-xl aspect-[3/2]"
          >
            {cat.iconUrl ? (
              <FallbackImage
                src={cat.iconUrl}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                fallbackClassName={`w-full h-full bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} group-hover:scale-105 transition-transform duration-500 flex items-center justify-center`}
                fallbackIcon={BookOpen}
                fallbackIconClassName="w-8 h-8 text-white/30"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} group-hover:scale-105 transition-transform duration-500 flex items-center justify-center`}>
                <BookOpen className="w-8 h-8 text-white/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex items-end p-3">
              <span className="text-white font-bold text-sm drop-shadow-lg">{cat.name}</span>
            </div>
          </Link>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-16">
          <Tag className="w-12 h-12 text-warm-300 mx-auto mb-4" />
          <p className="text-warm-500">No categories yet</p>
        </div>
      )}
    </div>
  );
}
