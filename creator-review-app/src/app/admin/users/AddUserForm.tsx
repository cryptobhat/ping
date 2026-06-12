'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Category, Role, UserStatus } from '@/lib/types';

interface AddUserFormProps {
  categories: Category[];
}

export function AddUserForm({ categories }: AddUserFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('creator');
  const [status, setStatus] = useState<UserStatus>('active');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const availableLanguages = Array.from(new Set(categories.map(category => category.language)));
  const creatorLanguages = Array.from(new Set(
    categories
      .filter(category => selectedCategoryIds.includes(category.id))
      .map(category => category.language)
  ));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    if (role === 'creator' && selectedCategoryIds.length === 0) {
      setError('Select at least one category for the creator');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          role,
          status,
          languages: role === 'reviewer' ? selectedLanguages : [],
          categoryIds: role === 'creator' ? selectedCategoryIds : []
        })
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to add user');
        return;
      }

      setSuccess('User added successfully');
      setEmail('');
      setRole('creator');
      setStatus('active');
      setSelectedLanguages([]);
      setSelectedCategoryIds([]);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-indigo-600" />
        Add New User
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
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1.5">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => {
              const nextRole = e.target.value as Role;
              setRole(nextRole);
              setSelectedLanguages([]);
              setSelectedCategoryIds([]);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            <option value="admin">Admin</option>
            <option value="creator">Creator</option>
            <option value="reviewer">Reviewer</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1.5">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as UserStatus)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {role === 'creator' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Categories *
            </label>
            {categories.length > 0 ? (
              <div className="space-y-2 max-h-52 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {categories.map(category => {
                  const isSelected = selectedCategoryIds.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryIds(prev =>
                          isSelected
                            ? prev.filter(id => id !== category.id)
                            : [...prev, category.id]
                        );
                      }}
                      className={`w-full flex items-center gap-2 p-2 rounded-md border text-left transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-300'
                          : 'bg-white border-gray-200 hover:border-indigo-200'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'
                      }`}>
                        {isSelected && <CheckCircle className="w-3 h-3" />}
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-gray-800">{category.name}</span>
                        <span className="block text-xs text-gray-400">
                          {category.language} · {category.content_type}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-amber-600">Create an active category before adding creators.</p>
            )}
            {creatorLanguages.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                Language access added automatically: {creatorLanguages.join(', ')}
              </p>
            )}
          </div>
        )}

        {role === 'reviewer' && availableLanguages.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Languages
            </label>
            <div className="flex flex-wrap gap-2">
              {availableLanguages.map(lang => {
                const isSelected = selectedLanguages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setSelectedLanguages(prev =>
                        isSelected
                          ? prev.filter(l => l !== lang)
                          : [...prev, lang]
                      );
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (role === 'creator' && categories.length === 0)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {loading ? 'Adding...' : 'Add User'}
        </button>
      </form>
    </div>
  );
}
