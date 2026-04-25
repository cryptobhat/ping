'use client';

import { useEffect, useState } from 'react';

/**
 * Subscribe to a CSS media query. Returns `false` during SSR / before hydration
 * so callers default to the mobile / narrow path — this avoids forcing a
 * keyboard / desktop affordance on touch devices on first paint.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    // Safari < 14 only supports addListener
    if (mql.addEventListener) {
      mql.addEventListener('change', update);
      return () => mql.removeEventListener('change', update);
    } else {
      mql.addListener(update);
      return () => mql.removeListener(update);
    }
  }, [query]);

  return matches;
}
