'use client';

import { useCallback, useMemo, useState } from 'react';
import { DetailPage, Feed, FilterZone, Header, TabBar } from '@/components/gotovo';
import { ALL_FILTER, EVENTS } from '@/lib/data';
import { filterEvents } from '@/lib/event-utils';
import type { GotovoEvent, TabType } from '@/lib/types';

/**
 * Gotovo - Event Discovery App
 *
 * A clean, modern event discovery application for Novi Sad and Belgrade.
 * Features filtering by category, city, and tags with Timeline and Recent views.
 */

export default function GotovoApp() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Navigation state
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const [detailEvent, setDetailEvent] = useState<GotovoEvent | null>(null);

  // Filter state
  const [activeCategory, setActiveCategory] = useState(ALL_FILTER);
  const [activeCity, setActiveCity] = useState(ALL_FILTER);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

  // Derived state
  const hasFilters =
    activeCategory !== ALL_FILTER || activeCity !== ALL_FILTER || activeTags.size > 0;

  // Filtered events - memoized to prevent unnecessary recalculation
  const filteredEvents = useMemo(
    () => filterEvents(EVENTS, activeCategory, activeCity, activeTags, ALL_FILTER),
    [activeCategory, activeCity, activeTags],
  );

  // Callbacks
  const toggleTag = useCallback((tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setActiveCategory(ALL_FILTER);
    setActiveCity(ALL_FILTER);
    setActiveTags(new Set());
  }, []);

  const openDetail = useCallback((event: GotovoEvent) => {
    setDetailEvent(event);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailEvent(null);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <Header
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Tab navigation */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Filters */}
      <FilterZone
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activeCity={activeCity}
        setActiveCity={setActiveCity}
        activeTags={activeTags}
        toggleTag={toggleTag}
      />

      {/* Main feed */}
      <main className="flex-1 overflow-y-auto">
        <Feed events={filteredEvents} tab={activeTab} onOpenEvent={openDetail} />
      </main>

      {/* Event detail panel */}
      <DetailPage event={detailEvent} onClose={closeDetail} />
    </div>
  );
}
