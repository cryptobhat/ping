'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Role, UserStatus } from '@/lib/types';
import { AlertCircle, CheckCircle, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';

interface UserListProps {
  users: User[];
  languageAssignments: { user_email: string; language: string }[];
}

const roleColors: Record<Role, string> = {
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
  creator: 'bg-blue-100 text-blue-800 border-blue-200',
  reviewer: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

const statusColors: Record<UserStatus, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function UserList({ users, languageAssignments }: UserListProps) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const languageMap = languageAssignments.reduce<Record<string, string[]>>((grouped, assignment) => {
    if (!grouped[assignment.user_email]) grouped[assignment.user_email] = [];
    grouped[assignment.user_email].push(assignment.language);
    return grouped;
  }, {});

  const toggleStatus = async (userId: string, currentStatus: UserStatus) => {
    setTogglingId(userId);
    setError('');
    setSuccess('');

    const newStatus: UserStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus })
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to update user');
        return;
      }

      setSuccess(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setTogglingId(null);
    }
  };

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-dashed p-8 text-center">
        <p className="text-gray-500">No users found</p>
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
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Languages
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${roleColors[user.role]}`}
                >
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {(languageMap[user.email] || []).map(lang => (
                    <span
                      key={lang}
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {lang}
                    </span>
                  ))}
                  {(!languageMap[user.email] || languageMap[user.email].length === 0) && (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[user.status]}`}
                >
                  {user.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => toggleStatus(user.id, user.status)}
                  disabled={togglingId === user.id}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {togglingId === user.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : user.status === 'active' ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-green-500" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-gray-400" />
                      Activate
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
