'use client';

import { useEffect, useState, useCallback } from 'react';
import { admin } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import Modal from '@/components/modal';

type PayoutStatus = 'pending' | 'completed' | 'rejected' | 'all';

interface Payout {
  id: string;
  userId: string;
  userName: string;
  userUsername: string;
  userPhone: string;
  amount: number;
  upiId: string;
  description: string;
  status: string;
  createdAt: string;
}

interface Stats {
  pending: number;
  completed: number;
  rejected: number;
  totalPaidINR: number;
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PayoutStatus>('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveId, setApproveId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [payoutRes, statsRes] = await Promise.all([
        admin.payouts.list(page, 20, filter),
        admin.payouts.stats(),
      ]);
      setPayouts(payoutRes.data || []);
      setTotalPages(payoutRes.pagination?.totalPages || 1);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch payouts', err);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async () => {
    if (!approveId) return;
    setProcessing(approveId);
    try {
      await admin.payouts.action(approveId, 'approve');
      setApproveId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    setProcessing(rejectId);
    try {
      await admin.payouts.action(rejectId, 'reject', rejectReason || undefined);
      setRejectId(null);
      setRejectReason('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject');
    } finally {
      setProcessing(null);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payouts</h1>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-600 font-medium">Pending</p>
            <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm text-green-600 font-medium">Completed</p>
            <p className="text-2xl font-bold text-green-800">{stats.completed}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-600 font-medium">Rejected</p>
            <p className="text-2xl font-bold text-red-800">{stats.rejected}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-600 font-medium">Total Paid</p>
            <p className="text-2xl font-bold text-blue-800">{formatCurrency(stats.totalPaidINR)}</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['pending', 'completed', 'rejected', 'all'] as PayoutStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => { setFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
              filter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : payouts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No {filter} payouts</div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-600">Writer</th>
                <th className="text-left p-3 font-medium text-gray-600">Amount</th>
                <th className="text-left p-3 font-medium text-gray-600">UPI ID</th>
                <th className="text-left p-3 font-medium text-gray-600">Status</th>
                <th className="text-left p-3 font-medium text-gray-600">Date</th>
                {filter === 'pending' && <th className="text-right p-3 font-medium text-gray-600">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {payouts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium">{p.userName || 'Unknown'}</div>
                    <div className="text-xs text-gray-400">@{p.userUsername} / {p.userPhone}</div>
                  </td>
                  <td className="p-3 font-semibold">{formatCurrency(p.amount)}</td>
                  <td className="p-3 font-mono text-xs">{p.upiId}</td>
                  <td className="p-3">{statusBadge(p.status)}</td>
                  <td className="p-3 text-gray-500">{formatDate(p.createdAt)}</td>
                  {filter === 'pending' && (
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => setApproveId(p.id)}
                        disabled={processing === p.id}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        {processing === p.id ? '...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => setRejectId(p.id)}
                        disabled={processing === p.id}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50">Prev</button>
          <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50">Next</button>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      <Modal open={!!approveId} onClose={() => setApproveId(null)} title="Confirm Approval">
        <p className="text-sm text-gray-600 mb-6">
          Have you already transferred the amount via UPI? This action will mark the payout as completed.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setApproveId(null)}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={processing === approveId}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {processing === approveId ? 'Approving...' : 'Yes, Approve'}
          </button>
        </div>
      </Modal>

      {/* Rejection Modal */}
      <Modal open={!!rejectId} onClose={() => { setRejectId(null); setRejectReason(''); }} title="Reject Withdrawal">
        <p className="text-sm text-gray-500 mb-3">Coins will be refunded to the writer.</p>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Reason (optional, shown to writer)"
          className="w-full border rounded-lg p-3 text-sm mb-4 resize-none"
          rows={3}
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => { setRejectId(null); setRejectReason(''); }}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={!!rejectId && processing === rejectId}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {rejectId && processing === rejectId ? 'Rejecting...' : 'Reject & Refund'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
