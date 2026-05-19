'use client';

import { useCallback, useMemo, useState } from 'react';
import { DetailPage, Feed, FilterZone, Header, TabBar } from '@/components/gotovo';
import type { Event, EventsPage, Facets } from '@/lib/api/schemas';
import { filterEvents } from '@/lib/event-utils';
import { ALL_FILTER } from '@/lib/filters';
import type { GotovoEvent, TabType } from '@/lib/types';

export interface FeedClientProps {
  initialPage: EventsPage;
  initialFacets?: Facets;
  locale: 'ru' | 'en';
  availableTags: string[];
}

/**
 * Client island. Receives server-fetched data, owns filter / tab / detail-modal
 * state. Filter changes apply in-memory against the initial page; Phase 2
 * (#0043) wires URL state and server-side re-fetch on filter change.
 */
export function FeedClient({ initialPage, availableTags }: FeedClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const [detailEvent, setDetailEvent] = useState<GotovoEvent | null>(null);

  const [activeCategory, setActiveCategory] = useState(ALL_FILTER);
  const [activeCity, setActiveCity] = useState(ALL_FILTER);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

  const hasFilters =
    activeCategory !== ALL_FILTER || activeCity !== ALL_FILTER || activeTags.size > 0;

  const events: Event[] = initialPage.data;

  const filteredEvents = useMemo(
    () => filterEvents(events, activeCategory, activeCity, activeTags, ALL_FILTER),
    [events, activeCategory, activeCity, activeTags],
  );

  const toggleTag = useCallback((tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setActiveCategory(ALL_FILTER);
    setActiveCity(ALL_FILTER);
    setActiveTags(new Set());
  }, []);

  const openDetail = useCallback((event: GotovoEvent) => setDetailEvent(event), []);
  const closeDetail = useCallback(() => setDetailEvent(null), []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header hasFilters={hasFilters} onClearFilters={clearFilters} />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <FilterZone
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activeCity={activeCity}
        setActiveCity={setActiveCity}
        activeTags={activeTags}
        toggleTag={toggleTag}
        availableTags={availableTags}
      />
      <main className="flex-1 overflow-y-auto">
        <Feed events={filteredEvents} tab={activeTab} onOpenEvent={openDetail} />
      </main>
      <DetailPage event={detailEvent} onClose={closeDetail} />
    </div>
  );
}
