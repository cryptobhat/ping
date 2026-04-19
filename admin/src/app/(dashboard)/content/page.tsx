'use client';

import { useEffect, useState, useCallback } from 'react';
import { admin } from '@/lib/api';
import { formatDate, truncate } from '@/lib/utils';
import Pagination from '@/components/pagination';
import Modal from '@/components/modal';

const CONTENT_TYPES = ['', 'QUOTE', 'STORY', 'POEM', 'ARTICLE'];

export default function ContentPage() {
  const [content, setContent] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [contentType, setContentType] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await admin.getContent(page, 20, contentType || undefined);
      setContent(res.data || []);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch content', err);
    } finally {
      setLoading(false);
    }
  }, [page, contentType]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setActionError('');
    try {
      await admin.deleteContent(deleteId);
      setDeleteId(null);
      fetchContent();
    } catch (err: any) {
      setActionError(err.message || 'Could not delete this content. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleFeature = async (id: string, currentState: boolean) => {
    setActionError('');
    try {
      await admin.featureContent(id, !currentState);
      fetchContent();
    } catch (err: any) {
      setActionError(err.message || 'Could not update featured status. Please try again.');
    }
  };

  const handlePremiumToggle = async (id: string, currentState: boolean) => {
    setActionError('');
    try {
      await admin.setPremiumContent(id, !currentState);
      fetchContent();
    } catch (err: any) {
      setActionError(err.message || 'Could not update premium status. Please try again.');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content</h1>
        <p className="mt-1 text-sm text-gray-500">Review and manage platform content</p>
      </div>

      <div className="card mb-6 !p-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Filter by type:</label>
          <select
            className="input max-w-xs"
            value={contentType}
            onChange={(e) => {
              setContentType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Types</option>
            {CONTENT_TYPES.filter(Boolean).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError('')}
            className="ml-4 text-red-500 hover:text-red-700"
            aria-label="Dismiss error"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="card overflow-hidden !p-0">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : content.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-gray-500">
            No content found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="table-header">Title</th>
                    <th className="table-header">Author</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Category</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Featured</th>
                    <th className="table-header">Premium</th>
                    <th className="table-header">Published</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {content.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="table-cell max-w-xs">
                        <p className="font-medium text-gray-900">{truncate(item.title || 'Untitled', 40)}</p>
                      </td>
                      <td className="table-cell">
                        <p className="text-sm">@{item.author?.username || '-'}</p>
                      </td>
                      <td className="table-cell">
                        <span className="badge-blue">{item.contentType || '-'}</span>
                      </td>
                      <td className="table-cell">{item.category?.name || '-'}</td>
                      <td className="table-cell">
                        <span className={item.status === 'PUBLISHED' ? 'badge-green' : 'badge-yellow'}>
                          {item.status || 'DRAFT'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => handleFeature(item.id, item.isFeatured)}
                          className={`text-xs font-medium ${
                            item.isFeatured ? 'text-yellow-600 hover:text-yellow-800' : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {item.isFeatured ? 'Featured' : 'Not Featured'}
                        </button>
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => handlePremiumToggle(item.id, item.isPremium)}
                          className={`text-xs font-medium ${
                            item.isPremium ? 'text-purple-600 hover:text-purple-800' : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {item.isPremium ? 'Premium' : 'Free'}
                        </button>
                      </td>
                      <td className="table-cell">{formatDate(item.createdAt)}</td>
                      <td className="table-cell">
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal open={!!deleteId} onClose={() => { setDeleteId(null); setActionError(''); }} title="Delete Content">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will permanently delete this content. All associated comments, likes, and reading history will also be removed. This action cannot be undone.
          </p>
          {actionError && deleteId && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{actionError}</p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => { setDeleteId(null); setActionError(''); }}
              className="btn-secondary"
              disabled={deleteLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="btn-danger"
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
