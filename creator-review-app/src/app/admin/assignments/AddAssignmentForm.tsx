'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface CreatorOption {
  email: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface AddAssignmentFormProps {
  creators: CreatorOption[];
  categories: CategoryOption[];
}

export function AddAssignmentForm({ creators, categories }: AddAssignmentFormProps) {
  const router = useRouter();
  const [selectedCreator, setSelectedCreator] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!selectedCreator) {
      setError('Please select a creator');
      setLoading(false);
      return;
    }

    if (!selectedCategory) {
      setError('Please select a category');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorEmail: selectedCreator,
          categoryId: selectedCategory
        })
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to create assignment');
        return;
      }

      setSuccess('Assignment created successfully');
      setSelectedCreator('');
      setSelectedCategory('');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-indigo-600" />
        Add Assignment
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="creator" className="block text-sm font-medium text-gray-700 mb-1.5">
            Creator
          </label>
          <select
            id="creator"
            value={selectedCreator}
            onChange={(e) => setSelectedCreator(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            <option value="">Select a creator...</option>
            {creators.map((c) => (
              <option key={c.email} value={c.email}>
                {c.email}
              </option>
            ))}
          </select>
          {creators.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">No active creators found</p>
          )}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">
            Category
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            <option value="">Select a category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {categories.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">No active categories found</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {loading ? 'Assigning...' : 'Assign Category'}
        </button>
      </form>
    </div>
  );
}
