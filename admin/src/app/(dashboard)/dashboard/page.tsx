'use client';

import { useEffect, useState } from 'react';
import { admin } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import StatCard from '@/components/stat-card';

interface Analytics {
  totalUsers: number;
  totalContent: number;
  totalTransactions: number;
  premiumUsers: number;
  totalRevenue: number;
}

interface DailyTopic {
  topic: string;
  topicKn: string;
  description: string;
  date: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Daily Topic state
  const [dailyTopic, setDailyTopic] = useState<DailyTopic>({ topic: '', topicKn: '', description: '', date: '' });
  const [topicForm, setTopicForm] = useState({ topic: '', topicKn: '', description: '' });
  const [topicSaving, setTopicSaving] = useState(false);
  const [topicLoaded, setTopicLoaded] = useState(false);
  const [topicError, setTopicError] = useState('');

  useEffect(() => {
    admin.getAnalytics().then((res) => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));

    admin.getDailyTopic().then((res) => {
      const t = res.data;
      setDailyTopic(t);
      setTopicForm({ topic: t.topic || '', topicKn: t.topicKn || '', description: t.description || '' });
      setTopicLoaded(true);
    }).catch(() => setTopicLoaded(true));
  }, []);

  const handleSaveTopic = async () => {
    if (!topicForm.topic.trim()) return;
    setTopicSaving(true);
    setTopicError('');
    try {
      await admin.setDailyTopic({
        topic: topicForm.topic.trim(),
        topicKn: topicForm.topicKn.trim() || undefined,
        description: topicForm.description.trim() || undefined,
      });
      setDailyTopic({
        topic: topicForm.topic.trim(),
        topicKn: topicForm.topicKn.trim(),
        description: topicForm.description.trim(),
        date: new Date().toISOString().split('T')[0],
      });
    } catch (err: any) {
      setTopicError(err.message || 'Failed to save writing prompt');
    }
    setTopicSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of platform metrics</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={data?.totalUsers?.toLocaleString() || '0'}
          subtitle="All registered users"
          color="brand"
        />
        <StatCard
          title="Premium Users"
          value={data?.premiumUsers?.toLocaleString() || '0'}
          subtitle="Active subscribers"
          color="green"
        />
        <StatCard
          title="Total Content"
          value={data?.totalContent?.toLocaleString() || '0'}
          subtitle="Published pieces"
          color="blue"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data?.totalRevenue || 0)}
          subtitle={`${data?.totalTransactions || 0} transactions`}
          color="yellow"
        />
      </div>

      {/* Writing Prompt Card */}
      <div className="mt-8">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Writing Prompt</h2>
            {dailyTopic.date && (
              <span className="text-xs text-gray-400">Last set: {dailyTopic.date}</span>
            )}
          </div>
          {dailyTopic.topic && (
            <div className="mb-4 rounded-lg bg-brand-50 border border-brand-200 p-4">
              <p className="text-sm font-medium text-brand-800">Current prompt: {dailyTopic.topic}</p>
              {dailyTopic.topicKn && <p className="text-sm text-brand-600 mt-1">{dailyTopic.topicKn}</p>}
              {dailyTopic.description && <p className="text-xs text-gray-500 mt-1">{dailyTopic.description}</p>}
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Topic (English)</label>
              <input
                type="text"
                value={topicForm.topic}
                onChange={(e) => setTopicForm({ ...topicForm, topic: e.target.value })}
                placeholder="Enter writing prompt..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Topic (Kannada)</label>
              <input
                type="text"
                value={topicForm.topicKn}
                onChange={(e) => setTopicForm({ ...topicForm, topicKn: e.target.value })}
                placeholder="ಕನ್ನಡದಲ್ಲಿ ವಿಷಯ..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
              <input
                type="text"
                value={topicForm.description}
                onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                placeholder="Brief description or prompt for writers..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>
            {topicError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{topicError}</p>
            )}
            <button
              onClick={handleSaveTopic}
              disabled={topicSaving || !topicForm.topic.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {topicSaving ? 'Saving...' : 'Save Writing Prompt'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <a href="/users" className="rounded-lg border border-gray-200 p-4 text-center transition-colors hover:border-brand-300 hover:bg-brand-50">
              <p className="text-sm font-medium text-gray-900">Manage Users</p>
              <p className="mt-1 text-xs text-gray-500">View and manage users</p>
            </a>
            <a href="/content" className="rounded-lg border border-gray-200 p-4 text-center transition-colors hover:border-brand-300 hover:bg-brand-50">
              <p className="text-sm font-medium text-gray-900">Manage Content</p>
              <p className="mt-1 text-xs text-gray-500">Review and moderate</p>
            </a>
            <a href="/competitions" className="rounded-lg border border-gray-200 p-4 text-center transition-colors hover:border-brand-300 hover:bg-brand-50">
              <p className="text-sm font-medium text-gray-900">Competitions</p>
              <p className="mt-1 text-xs text-gray-500">Create writing contests</p>
            </a>
            <a href="/subscriptions" className="rounded-lg border border-gray-200 p-4 text-center transition-colors hover:border-brand-300 hover:bg-brand-50">
              <p className="text-sm font-medium text-gray-900">Subscriptions</p>
              <p className="mt-1 text-xs text-gray-500">Manage plans & pricing</p>
            </a>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Platform Health</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="text-sm font-medium text-gray-900">
                {data && data.totalUsers > 0
                  ? ((data.premiumUsers / data.totalUsers) * 100).toFixed(1)
                  : '0'}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-brand-500 transition-all"
                style={{
                  width: `${data && data.totalUsers > 0 ? Math.min((data.premiumUsers / data.totalUsers) * 100, 100) : 0}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Revenue per User</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(data && data.totalUsers > 0 ? data.totalRevenue / data.totalUsers : 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Content per User</span>
              <span className="text-sm font-medium text-gray-900">
                {data && data.totalUsers > 0 ? (data.totalContent / data.totalUsers).toFixed(1) : '0'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
