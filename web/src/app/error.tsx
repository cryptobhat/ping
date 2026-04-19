'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="w-24 h-24 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-12 h-12 text-red-400 dark:text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-warm-900 dark:text-warm-100 mb-2">Something went wrong</h2>
        <p className="text-warm-500 mb-2 text-sm leading-relaxed">
          An unexpected error occurred. Our team has been notified and is working on it.
        </p>
        {error.digest && (
          <p className="text-xs text-warm-400 mb-6 font-mono">Ref: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <a
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300 rounded-xl text-sm font-semibold hover:bg-warm-200 dark:hover:bg-warm-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
