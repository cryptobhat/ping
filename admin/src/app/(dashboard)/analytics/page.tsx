'use client';

import { useEffect, useState } from 'react';
import { admin } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import StatCard from '@/components/stat-card';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    admin.getAnalytics().then((res) => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const conversionRate = data && data.totalUsers > 0
    ? ((data.premiumUsers / data.totalUsers) * 100).toFixed(1)
    : '0';
  const arpu = data && data.totalUsers > 0
    ? data.totalRevenue / data.totalUsers
    : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Platform performance metrics</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={data?.totalUsers?.toLocaleString() || '0'} color="brand" />
        <StatCard title="Premium Users" value={data?.premiumUsers?.toLocaleString() || '0'} color="green" />
        <StatCard title="Total Content" value={data?.totalContent?.toLocaleString() || '0'} color="blue" />
        <StatCard title="Revenue" value={formatCurrency(data?.totalRevenue || 0)} color="yellow" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Conversion Funnel */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Conversion Funnel</h2>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-600">All Users</span>
                <span className="font-medium">{data?.totalUsers?.toLocaleString() || 0}</span>
              </div>
              <div className="h-3 rounded-full bg-gray-100">
                <div className="h-3 rounded-full bg-brand-500" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-600">Premium Users ({conversionRate}%)</span>
                <span className="font-medium">{data?.premiumUsers?.toLocaleString() || 0}</span>
              </div>
              <div className="h-3 rounded-full bg-gray-100">
                <div
                  className="h-3 rounded-full bg-green-500"
                  style={{ width: `${Math.max(Number(conversionRate), 2)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Key Metrics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="text-lg font-bold text-brand-600">{conversionRate}%</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span className="text-sm text-gray-600">ARPU</span>
              <span className="text-lg font-bold text-brand-600">{formatCurrency(arpu)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span className="text-sm text-gray-600">Content per User</span>
              <span className="text-lg font-bold text-brand-600">
                {data && data.totalUsers > 0 ? (data.totalContent / data.totalUsers).toFixed(1) : '0'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span className="text-sm text-gray-600">Total Transactions</span>
              <span className="text-lg font-bold text-brand-600">
                {data?.totalTransactions?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PostHog Embed Placeholder */}
      <div className="mt-8 card">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Detailed Analytics</h2>
        <p className="mb-4 text-sm text-gray-500">
          Connect PostHog for advanced session replays, funnels, and retention analysis.
        </p>
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
          <div className="text-center">
            <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">PostHog Dashboard Embed</p>
            <p className="mt-1 text-xs text-gray-400">
              Add your PostHog shared dashboard URL to embed here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
