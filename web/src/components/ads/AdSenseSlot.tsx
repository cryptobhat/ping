'use client';

import { useEffect, useRef } from 'react';

/**
 * Display unit — requires NEXT_PUBLIC_ADSENSE_CLIENT and NEXT_PUBLIC_ADSENSE_SLOT.
 * Load {@link AdSenseScript} once in layout.
 */
export function AdSenseSlot({ className = '' }: { className?: string }) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT;
  const pushed = useRef(false);

  useEffect(() => {
    if (!client || !slot || pushed.current) return;
    const t = window.setTimeout(() => {
      try {
        const w = window as unknown as { adsbygoogle?: unknown[] };
        w.adsbygoogle = w.adsbygoogle || [];
        w.adsbygoogle.push({});
        pushed.current = true;
      } catch {
        /* ignore */
      }
    }, 1500);
    return () => window.clearTimeout(t);
  }, [client, slot]);

  if (!client || !slot) return null;

  return (
    <div className={`rounded-2xl border border-warm-100 dark:border-warm-800 bg-warm-50/40 dark:bg-warm-900/20 overflow-hidden ${className}`}>
      <p className="text-[10px] text-center text-warm-400 py-1.5 uppercase tracking-wide">Sponsored</p>
      <ins
        className="adsbygoogle block min-h-[90px] w-full px-2 pb-3"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
