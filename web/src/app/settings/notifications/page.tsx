'use client';

import Link from 'next/link';
import { ArrowLeft, Bell, Construction } from 'lucide-react';

export default function NotificationsSettingsPage() {
  return (
    <div className="px-4 lg:px-8 py-8 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/settings"
          className="p-2.5 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-warm-600 dark:text-warm-400" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center">
            <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-xl font-bold text-warm-900 dark:text-warm-50">Notifications</h1>
        </div>
      </div>

      <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center mx-auto mb-4">
          <Construction className="w-7 h-7 text-warm-400" />
        </div>
        <h2 className="text-lg font-semibold text-warm-800 dark:text-warm-200 mb-2">
          Coming Soon
        </h2>
        <p className="text-sm text-warm-500 max-w-sm mx-auto mb-6">
          Notification preferences are being built. You will soon be able to control push and email
          notifications right here.
        </p>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>
      </div>
    </div>
  );
}
