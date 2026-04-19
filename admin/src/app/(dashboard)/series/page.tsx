'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { admin } from '@/lib/api';
import { formatDate, truncate } from '@/lib/utils';
import Pagination from '@/components/pagination';

export default function SeriesPage() {
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchSeries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await admin.getSeries(page, 20);
      setSeries(res.data || []);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch series', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setEpisodes([]);
      return;
    }
    setExpandedId(id);
    setEpisodesLoading(true);
    try {
      const res = await admin.getSeriesById(id);
      const items = res.data?.items || res.data?.episodes || [];
      setEpisodes(items);
    } catch (err) {
      console.error('Failed to fetch series episodes', err);
      setEpisodes([]);
    } finally {
      setEpisodesLoading(false);
    }
  };

  const handleEpisodePremiumToggle = async (contentId: string, currentState: boolean) => {
    setActionError('');
    try {
      await admin.setPremiumContent(contentId, !currentState);
      // Refresh episodes
      if (expandedId) {
        const res = await admin.getSeriesById(expandedId);
        setEpisodes(res.data?.items || res.data?.episodes || []);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to toggle premium status');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Series</h1>
        <p className="mt-1 text-sm text-gray-500">Manage content series and episode premium settings</p>
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
        ) : series.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-gray-500">
            <p>No series found</p>
            <p className="text-xs">Series are created by authors from the app</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="table-header w-8"></th>
                    <th className="table-header">Title</th>
                    <th className="table-header">Author</th>
                    <th className="table-header">Episodes</th>
                    <th className="table-header">Premium</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Language</th>
                    <th className="table-header">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {series.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(item.id)}>
                        <td className="table-cell text-center">
                          <span className={`inline-block text-gray-400 transition-transform ${expandedId === item.id ? 'rotate-90' : ''}`}>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            {item.coverImage && (
                              <img src={item.coverImage} alt="" className="h-8 w-12 rounded object-cover flex-shrink-0" />
                            )}
                            <span className="font-medium text-gray-900">{truncate(item.title, 40)}</span>
                          </div>
                        </td>
                        <td className="table-cell">@{item.author?.username || '-'}</td>
                        <td className="table-cell">{item.itemCount ?? item._count?.items ?? item.contentCount ?? 0}</td>
                        <td className="table-cell">
                          <span className={item.isPremium ? 'badge-yellow' : 'text-gray-400 text-xs'}>
                            {item.isPremium ? 'Premium' : 'Free'}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className={item.status === 'COMPLETED' ? 'badge-green' : 'badge-blue'}>
                            {item.status || 'ONGOING'}
                          </span>
                        </td>
                        <td className="table-cell text-xs">{item.language || '-'}</td>
                        <td className="table-cell">{formatDate(item.createdAt)}</td>
                      </tr>

                      {/* Expanded episodes row */}
                      {expandedId === item.id && (
                        <tr key={`${item.id}-episodes`}>
                          <td colSpan={8} className="bg-gray-50 px-6 py-4">
                            {episodesLoading ? (
                              <div className="flex h-16 items-center justify-center">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                              </div>
                            ) : episodes.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-2">No episodes in this series</p>
                            ) : (
                              <div>
                                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                                  Episodes ({episodes.length})
                                </h4>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-xs text-gray-500 border-b border-gray-200">
                                      <th className="text-left py-2 px-3">#</th>
                                      <th className="text-left py-2 px-3">Title</th>
                                      <th className="text-left py-2 px-3">Type</th>
                                      <th className="text-left py-2 px-3">Status</th>
                                      <th className="text-left py-2 px-3">Premium</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {episodes.map((ep: any, idx: number) => {
                                      const content = ep.content || ep;
                                      const contentId = content.id || ep.contentId;
                                      const isPremium = content.isPremium ?? false;
                                      return (
                                        <tr key={ep.id || idx} className="hover:bg-white">
                                          <td className="py-2 px-3 text-gray-400">{ep.sortOrder ?? idx + 1}</td>
                                          <td className="py-2 px-3 font-medium text-gray-900">
                                            {truncate(content.title || 'Untitled', 50)}
                                          </td>
                                          <td className="py-2 px-3">
                                            <span className="badge-blue text-xs">{content.contentType || '-'}</span>
                                          </td>
                                          <td className="py-2 px-3">
                                            <span className={content.status === 'PUBLISHED' ? 'badge-green text-xs' : 'badge-yellow text-xs'}>
                                              {content.status || content.isDraft === false ? 'PUBLISHED' : 'DRAFT'}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (contentId) handleEpisodePremiumToggle(contentId, isPremium);
                                              }}
                                              className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                                                isPremium
                                                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                              }`}
                                            >
                                              {isPremium ? 'Premium' : 'Free'}
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
