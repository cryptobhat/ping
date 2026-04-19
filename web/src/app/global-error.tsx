'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
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
    <html lang="en">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: 'linear-gradient(135deg, #FAFAF8 0%, #F5F0EB 100%)',
          color: '#1a1a1a',
        }}>
          <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
            <div style={{
              width: '96px', height: '96px', borderRadius: '50%',
              background: '#FEE2E2', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 1.5rem',
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#1C1917' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#78716C', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              We hit an unexpected error. Our team has been notified. You can try reloading, or come back shortly.
            </p>
            {error.digest && (
              <p style={{ fontSize: '0.75rem', color: '#A8A29E', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
                Ref: {error.digest}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.625rem 1.5rem', fontSize: '0.875rem', fontWeight: 600,
                  color: '#fff', background: 'linear-gradient(135deg, #0D8B7E, #0A6B62)',
                  border: 'none', borderRadius: '0.75rem', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(245, 47, 87, 0.25)',
                }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{
                  padding: '0.625rem 1.5rem', fontSize: '0.875rem', fontWeight: 600,
                  color: '#57534E', backgroundColor: '#F5F5F4', border: '1px solid #E7E5E4',
                  borderRadius: '0.75rem', textDecoration: 'none', cursor: 'pointer',
                }}
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
