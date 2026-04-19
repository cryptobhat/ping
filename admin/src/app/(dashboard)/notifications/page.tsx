'use client';

import { useState } from 'react';
import { admin } from '@/lib/api';

interface BroadcastEntry {
  title: string;
  body: string;
  target: string;
  sentAt: string;
  status: 'success' | 'error';
}

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [history, setHistory] = useState<BroadcastEntry[]>([]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      setMessage('Title and body are required');
      setMessageType('error');
      return;
    }

    setSending(true);
    setMessage('');
    try {
      await admin.notifications.broadcast({ title: title.trim(), body: body.trim(), target });
      setMessage('Notification broadcast sent successfully');
      setMessageType('success');

      // Add to local history
      setHistory((prev) => [
        {
          title: title.trim(),
          body: body.trim(),
          target,
          sentAt: new Date().toISOString(),
          status: 'success',
        },
        ...prev,
      ]);

      // Reset form
      setTitle('');
      setBody('');
      setTarget('all');
    } catch (err: any) {
      setMessage(err.message || 'Failed to send notification');
      setMessageType('error');

      setHistory((prev) => [
        {
          title: title.trim(),
          body: body.trim(),
          target,
          sentAt: new Date().toISOString(),
          status: 'error',
        },
        ...prev,
      ]);
    } finally {
      setSending(false);
    }
  };

  const targetLabel = (t: string) => {
    switch (t) {
      case 'all':
        return 'All Users';
      case 'premium':
        return 'Premium Users';
      case 'creators':
        return 'Creators';
      default:
        return t;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Broadcast push notifications to your user base
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Broadcast form */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Send Broadcast</h2>
          <p className="text-xs text-gray-500 mb-6">
            This will send a push notification to the selected audience. Please review before sending.
          </p>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label htmlFor="notif-title" className="mb-1.5 block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                id="notif-title"
                type="text"
                className="input"
                placeholder="Notification title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                required
              />
              <p className="mt-1 text-xs text-gray-400">{title.length}/100 characters</p>
            </div>

            <div>
              <label htmlFor="notif-body" className="mb-1.5 block text-sm font-medium text-gray-700">
                Body
              </label>
              <textarea
                id="notif-body"
                className="input min-h-[120px] resize-y"
                placeholder="Notification body message..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={500}
                required
              />
              <p className="mt-1 text-xs text-gray-400">{body.length}/500 characters</p>
            </div>

            <div>
              <label htmlFor="notif-target" className="mb-1.5 block text-sm font-medium text-gray-700">
                Target Audience
              </label>
              <select
                id="notif-target"
                className="input"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <option value="all">All Users</option>
                <option value="premium">Premium Users Only</option>
                <option value="creators">Creators Only</option>
              </select>
            </div>

            {/* Preview */}
            {(title || body) && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Preview</p>
                <div className="rounded-lg bg-white p-3 shadow-sm border border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{title || 'Notification Title'}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{body || 'Notification body text...'}</p>
                  <p className="text-xs text-gray-400 mt-1">Target: {targetLabel(target)}</p>
                </div>
              </div>
            )}

            {message && (
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  messageType === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !title.trim() || !body.trim()}
              className="btn-primary w-full"
            >
              {sending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending...
                </span>
              ) : (
                'Send Notification'
              )}
            </button>
          </form>
        </div>

        {/* Recent broadcasts history */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Recent Broadcasts</h2>
          <p className="text-xs text-gray-500 mb-6">
            History of notifications sent during this session
          </p>

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg
                className="h-12 w-12 text-gray-300 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
              <p className="text-sm text-gray-500">No broadcasts sent yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Sent notifications will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-3 ${
                    entry.status === 'success'
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {entry.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                        {entry.body}
                      </p>
                    </div>
                    <span
                      className={
                        entry.status === 'success' ? 'badge-green' : 'badge-red'
                      }
                    >
                      {entry.status === 'success' ? 'Sent' : 'Failed'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>Target: {targetLabel(entry.target)}</span>
                    <span>
                      {new Date(entry.sentAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
