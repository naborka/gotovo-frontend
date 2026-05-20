'use client';

import { parseAsArrayOf, parseAsString, parseAsStringEnum, useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { Feed, FeedFooter, FilterZone, Header, TabBar } from '@/components/gotovo';
import { useEventPagination } from '@/hooks/use-event-pagination';
import type { ListEventsParams } from '@/lib/api/client';
import type { EventsPage, Facets } from '@/lib/api/schemas';
import { ALL_CATEGORIES, ALL_CITIES, ALL_FILTER, EVENTS_PAGE_LIMIT } from '@/lib/filters';
import type { TabType } from '@/lib/types';
import { clearScrollSnapshot, useScrollRestore } from '@/lib/use-scroll-snapshot';

export interface FeedClientProps {
  initialPage: EventsPage;
  initialFacets?: Facets;
  locale: 'ru' | 'en';
  availableTags: string[];
}

const SORT_VALUES = ['timeline', 'recent'] as const;
const TAG_MODE_VALUES = ['any', 'all'] as const;

/**
 * Client island. Receives server-fetched data, owns filter/tab/modal state via
 * URL params (nuqs). Every filter change updates the URL, which the RSC reads
 * to re-fetch — server-driven filtering with shareable links.
 */
export function FeedClient({ initialPage, locale, availableTags }: FeedClientProps) {
  useScrollRestore();
  const opts = { shallow: false, scroll: false, clearOnDefault: true } as const;

  const [category, setCategory] = useQueryState(
    'category',
    parseAsStringEnum([...ALL_CATEGORIES]).withOptions(opts),
  );
  const [city, setCity] = useQueryState(
    'city',
    parseAsStringEnum([...ALL_CITIES]).withOptions(opts),
  );
  const [tagArr, setTagArr] = useQueryState('tag', parseAsArrayOf(parseAsString).withOptions(opts));
  const [sort, setSort] = useQueryState(
    'sort',
    parseAsStringEnum([...SORT_VALUES]).withOptions(opts),
  );
  // tagMode is reserved for the URL contract but not exposed in v1 UI; default 'any'.
  // Phase 2.x adds an any/all toggle.
  const [, setTagMode] = useQueryState(
    'tagMode',
    parseAsStringEnum([...TAG_MODE_VALUES]).withOptions(opts),
  );

  const activeCategory = category ?? ALL_FILTER;
  const activeCity = city ?? ALL_FILTER;
  const activeTags = useMemo(() => new Set(tagArr ?? []), [tagArr]);
  const activeTab: TabType = sort === 'recent' ? 'recent' : 'timeline';

  const hasFilters =
    activeCategory !== ALL_FILTER || activeCity !== ALL_FILTER || activeTags.size > 0;

  // Mirrors the RSC's list query so cursor pages continue the same result set.
  const listParams = useMemo<ListEventsParams>(() => {
    const params: ListEventsParams = {
      tagMode: 'any',
      sort: activeTab === 'recent' ? 'recent' : 'timeline',
      limit: EVENTS_PAGE_LIMIT,
    };
    if (category) params.category = category;
    if (city) params.city = city;
    if (tagArr && tagArr.length > 0) params.tag = tagArr;
    return params;
  }, [category, city, tagArr, activeTab]);

  const { events, hasMore, loading, error, sentinelRef, retry } = useEventPagination({
    initialPage,
    params: listParams,
    locale,
  });

  type CategoryParam = (typeof ALL_CATEGORIES)[number];
  type CityParam = (typeof ALL_CITIES)[number];

  const updateCategory = useCallback(
    (cat: string) => setCategory(cat === ALL_FILTER ? null : (cat as CategoryParam)),
    [setCategory],
  );
  const updateCity = useCallback(
    (c: string) => setCity(c === ALL_FILTER ? null : (c as CityParam)),
    [setCity],
  );
  const toggleTag = useCallback(
    (tag: string) => {
      setTagArr((prev) => {
        const list = prev ?? [];
        const next = list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag];
        return next.length === 0 ? null : next;
      });
    },
    [setTagArr],
  );
  const setTab = useCallback((t: TabType) => setSort(t === 'recent' ? 'recent' : null), [setSort]);
  const clearFilters = useCallback(() => {
    setCategory(null);
    setCity(null);
    setTagArr(null);
    setTagMode(null);
    // Filter clear repaints the list; old scroll position no longer maps.
    clearScrollSnapshot();
  }, [setCategory, setCity, setTagArr, setTagMode]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header hasFilters={hasFilters} onClearFilters={clearFilters} />
      <TabBar activeTab={activeTab} onTabChange={setTab} />
      <FilterZone
        activeCategory={activeCategory}
        setActiveCategory={updateCategory}
        activeCity={activeCity}
        setActiveCity={updateCity}
        activeTags={activeTags}
        toggleTag={toggleTag}
        availableTags={availableTags}
      />
      <main className="flex-1 overflow-y-auto">
        <Feed events={events} tab={activeTab} />
        {events.length > 0 && (
          <>
            <div ref={sentinelRef} aria-hidden="true" />
            <FeedFooter loading={loading} hasMore={hasMore} error={error != null} onRetry={retry} />
          </>
        )}
      </main>
    </div>
  );
}
