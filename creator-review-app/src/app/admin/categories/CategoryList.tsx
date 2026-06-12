'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Category, CategoryStatus } from '@/lib/types';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface CategoryListProps {
  categories: Category[];
}

const contentTypeLabels: Record<string, string> = {
  poster: 'Poster',
  video: 'Video',
  both: 'Both',
};

export function CategoryList({ categories }: CategoryListProps) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const toggleStatus = async (categoryId: string, currentStatus: CategoryStatus) => {
    setTogglingId(categoryId);
    setError('');
    setSuccess('');

    const newStatus: CategoryStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, status: newStatus })
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to update category');
        return;
      }

      setSuccess(`Category ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
    } finally {
      setTogglingId(null);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-dashed p-8 text-center">
        <p className="text-gray-500">No categories found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Language
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Content Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {categories.map((category) => (
            <tr key={category.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{category.name}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{category.language}</td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {contentTypeLabels[category.content_type] || category.content_type}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                    category.status === 'active'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                  }`}
                >
                  {category.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => toggleStatus(category.id, category.status)}
                  disabled={togglingId === category.id}
                  className="text-sm text-gray-600 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {togglingId === category.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : category.status === 'active' ? (
                    'Deactivate'
                  ) : (
                    'Activate'
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
