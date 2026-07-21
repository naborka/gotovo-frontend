'use client';

import { useCallback, useEffect } from 'react';

const KEY = 'gotovo.feedScrollY';

/**
 * The feed scrolls inside a dedicated container (fixed chrome above it), not
 * the window. Snapshot/restore and quick-jump target it via this id.
 */
export const FEED_SCROLL_CONTAINER_ID = 'feed-scroll';

export const getFeedScrollContainer = (): HTMLElement | null =>
  typeof document === 'undefined' ? null : document.getElementById(FEED_SCROLL_CONTAINER_ID);

/** Snapshot the feed scroll position to sessionStorage. */
export function useScrollSnapshot(): () => void {
  return useCallback(() => {
    const container = getFeedScrollContainer();
    if (!container) return;
    try {
      sessionStorage.setItem(KEY, String(container.scrollTop));
    } catch {
      // private browsing — no-op
    }
  }, []);
}

/** Restore the feed scroll position from sessionStorage on mount. */
export function useScrollRestore(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Hand off restoration from browser to us.
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw == null) return;
      const y = Number.parseInt(raw, 10);
      if (!Number.isFinite(y)) return;
      // Defer one frame so the page has laid out before scrolling.
      requestAnimationFrame(() => {
        getFeedScrollContainer()?.scrollTo({ top: y, behavior: 'instant' });
      });
    } catch {
      // private browsing — no-op
    }
  }, []);
}

/** Drop the snapshot — call when the user navigates away from the feed for
 *  reasons other than card-click, or when filter changes invalidate the position. */
export function clearScrollSnapshot(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // private browsing — no-op
  }
}
