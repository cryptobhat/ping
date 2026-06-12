'use client';
import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface Props {
  users: { email: string; role: string; name: string | null }[];
  assignments: { id: string; user_email: string; language: string }[];
  languages: string[];
}

export function LanguageAssignmentManager({ users, assignments: initialAssignments, languages }: Props) {
  const [localAssignments, setLocalAssignments] = useState(initialAssignments);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getUserLangs = (email: string) => new Set(localAssignments.filter(a => a.user_email === email).map(a => a.language));

  const handleToggle = async (userEmail: string, language: string, currentlyAssigned: boolean) => {
    const key = `${userEmail}:${language}`;
    setLoading(key);
    setError('');
    setSuccess('');

    try {
      if (currentlyAssigned) {
        const assignment = localAssignments.find(a => a.user_email === userEmail && a.language === language);
        if (assignment) {
          const response = await fetch('/api/admin/languages', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignmentId: assignment.id })
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Failed to remove language');
          setLocalAssignments(prev => prev.filter(a => a.id !== assignment.id));
        }
      } else {
        const response = await fetch('/api/admin/languages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail, language })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to assign language');
        if (result.assignment) {
          setLocalAssignments(prev => [...prev, result.assignment]);
        }
      }
      setSuccess(`${language} ${currentlyAssigned ? 'removed from' : 'assigned to'} ${userEmail}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-dashed p-12 text-center">
        <p className="text-gray-500">No active creators or reviewers found</p>
      </div>
    );
  }

  if (languages.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-dashed p-12 text-center">
        <p className="text-gray-500">No languages found. Create categories first.</p>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              {languages.map(lang => (
                <th key={lang} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">{lang}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => {
              const userLangs = getUserLangs(user.email);
              return (
                <tr key={user.email} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-sm text-gray-900 sticky left-0 bg-white">{user.email}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {user.role}
                    </span>
                  </td>
                  {languages.map(lang => {
                    const hasAccess = userLangs.has(lang);
                    const key = `${user.email}:${lang}`;
                    return (
                      <td key={lang} className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => handleToggle(user.email, lang, hasAccess)}
                          disabled={loading === key}
                          className={`w-8 h-8 rounded border-2 flex items-center justify-center transition-colors disabled:opacity-50 ${
                            hasAccess
                              ? 'bg-indigo-500 border-indigo-500 text-white'
                              : 'border-gray-300 hover:border-indigo-400'
                          }`}
                        >
                          {loading === key ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : hasAccess ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : null}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
