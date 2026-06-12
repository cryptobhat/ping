import { clsx } from 'clsx';
import { SubmissionStatus } from '@/lib/types';

const statusStyles: Record<SubmissionStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  drive_failed: 'bg-orange-100 text-orange-800 border-orange-200'
};

const statusLabels: Record<SubmissionStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  drive_failed: 'Drive Failed'
};

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', statusStyles[status])}>
      {statusLabels[status]}
    </span>
  );
}
