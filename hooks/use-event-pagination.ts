'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getEvents, type ListEventsParams } from '@/lib/api/client';
import type { Event, EventsPage } from '@/lib/api/schemas';

interface UseEventPaginationArgs {
  /** Server-rendered first page. A new object identity signals a filter/sort nav. */
  initialPage: EventsPage;
  /** Base list params (filters, sort, limit) — cursor is appended per request. */
  params: ListEventsParams;
  locale: 'ru' | 'en';
}

interface UseEventPaginationResult {
  events: Event[];
  hasMore: boolean;
  loading: boolean;
  error: Error | null;
  /** Callback ref — attach to the element that triggers the next page. */
  sentinelRef: (node: HTMLElement | null) => void;
  retry: () => void;
}

/** Append `next`, skipping any event whose uid is already present. */
const mergeByUid = (prev: Event[], next: Event[]): Event[] => {
  const seen = new Set(prev.map((e) => e.uid));
  return [...prev, ...next.filter((e) => !seen.has(e.uid))];
};

/**
 * Cursor-based infinite scroll for the event feed.
 *
 * The RSC re-fetches the first page on every filter/sort change, producing a
 * fresh `initialPage`. That identity change resets the accumulated list (no
 * stale append) and a token guard drops any response from a superseded
 * generation that lands after the reset.
 *
 * An `IntersectionObserver` only fires on a *change* in visibility, so loads
 * are driven by an effect keyed on the observer's boolean state — that re-runs
 * when `loading` clears, advancing the feed while the sentinel stays in view.
 */
export function useEventPagination({
  initialPage,
  params,
  locale,
}: UseEventPaginationArgs): UseEventPaginationResult {
  const [seed, setSeed] = useState(initialPage);
  const [events, setEvents] = useState<Event[]>(initialPage.data);
  const [cursor, setCursor] = useState<string | null>(initialPage.page.nextCursor);
  const [hasMore, setHasMore] = useState<boolean>(initialPage.page.hasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [intersecting, setIntersecting] = useState(false);

  // A new initialPage means the RSC re-fetched (filter/sort nav). Reset the
  // accumulated list during render — no flash, and in-flight loads are dropped
  // by the token guard below.
  if (seed !== initialPage) {
    setSeed(initialPage);
    setEvents(initialPage.data);
    setCursor(initialPage.page.nextCursor);
    setHasMore(initialPage.page.hasMore);
    setError(null);
  }

  // Latest seed, readable inside async closures to detect a superseded fetch.
  const seedRef = useRef(initialPage);
  seedRef.current = initialPage;
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore || cursor == null) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    const token = seedRef.current;
    try {
      const next = await getEvents({ ...params, cursor }, { locale });
      if (token !== seedRef.current) return; // filters changed mid-flight — drop
      setEvents((prev) => mergeByUid(prev, next.data));
      setCursor(next.page.nextCursor);
      setHasMore(next.page.hasMore);
    } catch (e) {
      if (token === seedRef.current) {
        setError(e instanceof Error ? e : new Error('Failed to load more events'));
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [cursor, hasMore, locale, params]);

  // Drives loads from the observer's visibility state. Re-runs when `loading`
  // clears or the cursor advances, so the feed keeps loading while the sentinel
  // stays in view. `error` gates auto-loading so a failing endpoint is not
  // hammered — recovery goes through `retry`.
  useEffect(() => {
    if (intersecting && hasMore && !loading && error == null) {
      void loadMore();
    }
  }, [intersecting, hasMore, loading, error, loadMore]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((node: HTMLElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (node == null) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setIntersecting(entry.isIntersecting);
      },
      { rootMargin: '600px' },
    );
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { events, hasMore, loading, error, sentinelRef, retry: loadMore };
}
