'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatDate } from '@/lib/utils';
import { admin } from '@/lib/api';

type ReportRow = {
  id: string;
  reason: string;
  description?: string | null;
  status: string;
  createdAt: string;
  content?: { id?: string; title?: string | null; contentType?: string } | null;
  reporter?: { id?: string; username?: string; name?: string } | null;
  resolvedByUser?: { username?: string; name?: string } | null;
};

const FILTERS = ['all', 'pending', 'resolved', 'rejected', 'action_taken'] as const;

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = filter === 'all' ? undefined : filter;
      const res = await admin.reports.list(page, 25, status);
      setReports((res.data || []) as ReportRow[]);
      const tp = res.pagination?.totalPages ?? 1;
      setTotalPages(Math.max(1, tp));
    } catch (e: any) {
      setError(e.message || 'Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, status: 'resolved' | 'rejected' | 'action_taken') => {
    setBusyId(id);
    setError(null);
    try {
      await admin.reports.resolve(id, status);
      await load();
    } catch (e: any) {
      setError(e.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const badge = (s: string) => {
    const x = (s || '').toLowerCase();
    if (x === 'pending') return 'badge-yellow';
    if (x === 'resolved' || x === 'action_taken') return 'badge-green';
    if (x === 'rejected') return 'badge-red';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content reports</h1>
        <p className="mt-1 text-sm text-gray-500">User-flagged content (moderation queue)</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>
      )}

      <div className="card mb-6 !p-4">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                setPage(1);
                setFilter(status);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === status ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden !p-0">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-gray-500">Loading…</div>
        ) : reports.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-gray-500">
            <p>No reports in this filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="table-header">Content</th>
                  <th className="table-header">Reporter</th>
                  <th className="table-header">Reason</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map((report) => {
                  const title = report.content?.title || '—';
                  const cid = report.content?.id;
                  const reporter =
                    report.reporter?.username || report.reporter?.name || report.reporter?.id || '—';
                  return (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="font-medium text-gray-900 line-clamp-2 max-w-xs">{title}</div>
                        {cid && (
                          <a
                            href={`${process.env.NEXT_PUBLIC_WEB_APP_URL || 'http://localhost:3001'}/content/${cid}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-brand-600 hover:underline"
                          >
                            Open
                          </a>
                        )}
                      </td>
                      <td className="table-cell text-sm">{reporter}</td>
                      <td className="table-cell text-sm">
                        <span className="font-medium">{report.reason}</span>
                        {report.description ? (
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{report.description}</p>
                        ) : null}
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge(report.status)}`}>
                          {report.status}
                        </span>
                        {report.resolvedByUser?.username && (
                          <p className="mt-1 text-[10px] text-gray-400">by @{report.resolvedByUser.username}</p>
                        )}
                      </td>
                      <td className="table-cell text-sm text-gray-600">{formatDate(report.createdAt)}</td>
                      <td className="table-cell">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            disabled={busyId === report.id || report.status !== 'pending'}
                            onClick={() => act(report.id, 'resolved')}
                            className="text-left text-xs text-green-600 hover:text-green-800 disabled:opacity-40"
                          >
                            Resolve
                          </button>
                          <button
                            type="button"
                            disabled={busyId === report.id || report.status !== 'pending'}
                            onClick={() => act(report.id, 'action_taken')}
                            className="text-left text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40"
                          >
                            Action taken
                          </button>
                          <button
                            type="button"
                            disabled={busyId === report.id || report.status !== 'pending'}
                            onClick={() => act(report.id, 'rejected')}
                            className="text-left text-xs text-red-600 hover:text-red-800 disabled:opacity-40"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
