'use client';

import { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { reportApi } from '@/lib/api';
import toast from 'react-hot-toast';

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'violence', label: 'Violence' },
  { value: 'sexual_content', label: 'Sexual content' },
  { value: 'copyright', label: 'Copyright' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'other', label: 'Other' },
] as const;

export function ReportContentModal({
  contentId,
  open,
  onClose,
}: {
  contentId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<string>('spam');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setLoading(true);
    try {
      await reportApi.submit({
        contentId,
        reason,
        description: description.trim() || undefined,
      });
      toast.success('Report submitted. Our team will review it.');
      onClose();
      setDescription('');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Could not submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-800 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-warm-100 dark:border-warm-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-warm-900 dark:text-warm-50">
            <Flag className="w-4 h-4 text-primary" />
            Report content
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-warm-100 dark:hover:bg-warm-800" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-warm-500">Tell us what is wrong. Reports are confidential.</p>
          <div>
            <label className="text-xs font-medium text-warm-600 dark:text-warm-400">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-xl border border-warm-200 dark:border-warm-700 bg-warm-50 dark:bg-warm-950 px-3 py-2 text-sm"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-warm-600 dark:text-warm-400">Details (optional, max 280)</label>
            <textarea
              value={description}
              maxLength={280}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-warm-200 dark:border-warm-700 bg-warm-50 dark:bg-warm-950 px-3 py-2 text-sm resize-none"
              placeholder="Add context if needed"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button className="flex-1" loading={loading} onClick={submit} type="button">
              Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
