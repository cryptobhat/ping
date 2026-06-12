'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader2, Trash2 } from 'lucide-react';

interface Assignment {
  id: string;
  creator_email: string;
  category_id: string;
  created_at: string;
  category: {
    id: string;
    name: string;
    language: string;
    content_type: string;
    status: string;
    created_at: string;
  } | null;
}

interface AssignmentListProps {
  assignments: Assignment[];
}

export function AssignmentList({ assignments }: AssignmentListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const removeAssignment = async (assignmentId: string) => {
    setDeletingId(assignmentId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId })
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to remove assignment');
        return;
      }

      setSuccess('Assignment removed');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to remove assignment');
    } finally {
      setDeletingId(null);
    }
  };

  if (assignments.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-dashed p-8 text-center">
        <p className="text-gray-500">No assignments found</p>
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
              Creator
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Language
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Assigned
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {assignments.map((assignment) => (
            <tr key={assignment.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900">{assignment.creator_email}</td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {assignment.category?.name || 'Unknown'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {assignment.category?.language || '\u2014'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                {new Date(assignment.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => removeAssignment(assignment.id)}
                  disabled={deletingId === assignment.id}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deletingId === assignment.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </>
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
