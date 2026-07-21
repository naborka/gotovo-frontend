'use client';

import { parseAsArrayOf, parseAsString, parseAsStringEnum, useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { Feed, FeedFooter, FilterZone, Header, QuickJump, TabBar } from '@/components/gotovo';
import { Footer } from '@/components/gotovo/footer';
import { useEventPagination } from '@/hooks/use-event-pagination';
import type { ListEventsParams } from '@/lib/api/client';
import type { EventsPage } from '@/lib/api/schemas';
import { groupEventsByDate, groupEventsByRecency } from '@/lib/event-utils';
import { ALL_CATEGORIES, ALL_CITIES, ALL_FILTER, EVENTS_PAGE_LIMIT } from '@/lib/filters';
import type { TabType } from '@/lib/types';
import {
  clearScrollSnapshot,
  FEED_SCROLL_CONTAINER_ID,
  getFeedScrollContainer,
  useScrollRestore,
} from '@/lib/use-scroll-snapshot';

export interface FeedClientProps {
  initialPage: EventsPage;
  locale: 'ru' | 'en';
}

const SORT_VALUES = ['timeline', 'recent'] as const;
const TAG_MODE_VALUES = ['any', 'all'] as const;

const scrollFeedToTop = (): void => {
  getFeedScrollContainer()?.scrollTo({ top: 0 });
};

/**
 * Client island. Receives server-fetched data, owns filter/tab state via URL
 * params (nuqs). Every filter change updates the URL, which the RSC reads to
 * re-fetch — server-driven filtering with shareable links. `category` is
 * multi-select (repeatable param, like `tag`); `city` is single-select.
 */
export function FeedClient({ initialPage, locale }: FeedClientProps) {
  useScrollRestore();
  const opts = { shallow: false, scroll: false, clearOnDefault: true } as const;

  const [categoryArr, setCategoryArr] = useQueryState(
    'category',
    parseAsArrayOf(parseAsStringEnum([...ALL_CATEGORIES])).withOptions(opts),
  );
  const [city, setCity] = useQueryState(
    'city',
    parseAsStringEnum([...ALL_CITIES]).withOptions(opts),
  );
  // The tag filter row is gone from the UI, but `tag` stays in the URL
  // contract (shared links, detail-page tags in a later phase).
  const [tagArr] = useQueryState('tag', parseAsArrayOf(parseAsString).withOptions(opts));
  const [sort, setSort] = useQueryState(
    'sort',
    parseAsStringEnum([...SORT_VALUES]).withOptions(opts),
  );
  const [, setTagMode] = useQueryState(
    'tagMode',
    parseAsStringEnum([...TAG_MODE_VALUES]).withOptions(opts),
  );

  const activeCity = city ?? ALL_FILTER;
  const activeCategories = useMemo(() => new Set<string>(categoryArr ?? []), [categoryArr]);
  const activeTab: TabType = sort === 'recent' ? 'recent' : 'timeline';

  const activeFilterCount = activeCategories.size + (city ? 1 : 0) + (tagArr ? tagArr.length : 0);

  // Mirrors the RSC's list query so cursor pages continue the same result set.
  const listParams = useMemo<ListEventsParams>(() => {
    const params: ListEventsParams = {
      tagMode: 'any',
      sort: activeTab === 'recent' ? 'recent' : 'timeline',
      limit: EVENTS_PAGE_LIMIT,
    };
    if (categoryArr && categoryArr.length > 0) params.category = categoryArr;
    if (city) params.city = city;
    if (tagArr && tagArr.length > 0) params.tag = tagArr;
    return params;
  }, [categoryArr, city, tagArr, activeTab]);

  const { events, hasMore, loading, error, sentinelRef, retry } = useEventPagination({
    initialPage,
    params: listParams,
    locale,
  });

  const groups = useMemo(
    () => (activeTab === 'recent' ? groupEventsByRecency(events) : groupEventsByDate(events)),
    [events, activeTab],
  );
  const groupKeys = useMemo(() => groups.map((g) => g.key).sort(), [groups]);

  type CategoryParam = (typeof ALL_CATEGORIES)[number];
  type CityParam = (typeof ALL_CITIES)[number];

  const updateCity = useCallback(
    (c: string) => {
      setCity(c === ALL_FILTER ? null : (c as CityParam));
      scrollFeedToTop();
    },
    [setCity],
  );
  const toggleCategory = useCallback(
    (cat: string) => {
      setCategoryArr((prev) => {
        const list = prev ?? [];
        const next = list.includes(cat as CategoryParam)
          ? list.filter((c) => c !== cat)
          : [...list, cat as CategoryParam];
        return next.length === 0 ? null : next;
      });
      scrollFeedToTop();
    },
    [setCategoryArr],
  );
  const setTab = useCallback((t: TabType) => setSort(t === 'recent' ? 'recent' : null), [setSort]);
  const clearFilters = useCallback(() => {
    setCategoryArr(null);
    setCity(null);
    setTagMode(null);
    // Filter clear repaints the list; old scroll position no longer maps.
    clearScrollSnapshot();
    scrollFeedToTop();
  }, [setCategoryArr, setCity, setTagMode]);

  return (
    <div className="h-dvh bg-background flex flex-col">
      <Header activeFilterCount={activeFilterCount} onClearFilters={clearFilters} />
      <TabBar activeTab={activeTab} onTabChange={setTab} />
      <FilterZone
        activeCity={activeCity}
        setActiveCity={updateCity}
        activeCategories={activeCategories}
        toggleCategory={toggleCategory}
      />
      {events.length > 0 && <QuickJump groupKeys={groupKeys} />}
      <main id={FEED_SCROLL_CONTAINER_ID} className="relative flex-1 overflow-y-auto">
        <Feed groups={groups} onClearFilters={clearFilters} />
        {events.length > 0 && (
          <>
            <div ref={sentinelRef} aria-hidden="true" />
            <FeedFooter loading={loading} hasMore={hasMore} error={error != null} onRetry={retry} />
          </>
        )}
        <Footer />
      </main>
    </div>
  );
}
