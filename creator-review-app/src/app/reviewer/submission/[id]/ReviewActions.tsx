'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ReviewActionsProps {
  submissionId: string;
  isPending: boolean;
  alreadyReviewed: boolean;
  reviewedStatus: string;
}

export function ReviewActions({
  submissionId,
  isPending,
  alreadyReviewed,
  reviewedStatus,
}: ReviewActionsProps) {
  const router = useRouter();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAccept = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/review/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to accept');
      setSuccess('Submission accepted and synced to Google Drive!');
      setTimeout(() => router.push('/reviewer/pending'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/review/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, reason: rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject');
      setSuccess('Submission rejected.');
      setTimeout(() => router.push('/reviewer/pending'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (alreadyReviewed && !success) {
    return (
      <div className="bg-white rounded-lg border p-5">
        <div className="flex items-center gap-2 mb-2">
          {reviewedStatus === 'accepted' ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
          <span className="font-medium text-gray-900">
            {reviewedStatus === 'accepted' ? 'Already Accepted' : 'Already Rejected'}
          </span>
        </div>
        <p className="text-sm text-gray-500">This submission has already been reviewed.</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white rounded-lg border p-5">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="font-medium text-green-700">Success</span>
        </div>
        <p className="text-sm text-gray-600">{success}</p>
        <p className="text-xs text-gray-400 mt-1">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!showRejectForm ? (
        <div className="space-y-3">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {loading
              ? 'Processing...'
              : reviewedStatus === 'drive_failed'
                ? 'Retry Drive Upload'
                : 'Accept & Upload to Drive'}
          </button>
          {reviewedStatus === 'pending' && (
            <button
              onClick={() => {
                setShowRejectForm(true);
                setError('');
              }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rejection Reason *
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this submission is being rejected..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {loading ? 'Rejecting...' : 'Confirm Reject'}
            </button>
            <button
              onClick={() => {
                setShowRejectForm(false);
                setError('');
                setRejectionReason('');
              }}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
