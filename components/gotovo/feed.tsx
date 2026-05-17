'use client';

import { EventCard } from './event-card';
import { EmptyState } from './empty-state';
import {
  groupEventsByDate,
  groupEventsByRecency,
  formatDateLong,
} from '@/lib/event-utils';
import type { GotovoEvent, TabType } from '@/lib/types';

/**
 * Event feed component displaying grouped event cards.
 * Supports Timeline and Recently Added views.
 */

interface FeedProps {
  events: GotovoEvent[];
  tab: TabType;
  onOpenEvent: (event: GotovoEvent) => void;
}

export function Feed({ events, tab, onOpenEvent }: FeedProps) {
  if (events.length === 0) {
    return <EmptyState />;
  }

  const groups =
    tab === 'recent' ? groupEventsByRecency(events) : groupEventsByDate(events);
  const total = events.length;

  return (
    <div className="pb-6">
      {/* Result summary */}
      <p className="px-3 pt-1.5 pb-0.5 font-mono text-[10px] text-faint md:px-6">
        {total} event{total !== 1 ? 's' : ''} · {groups.length} day
        {groups.length !== 1 ? 's' : ''}
      </p>

      {/* Date groups */}
      {groups.map((group, index) => (
        <div key={index} className="mt-2.5">
          {/* Date header */}
          <div className="flex items-baseline gap-2 px-3 py-1.5 border-b border-divider md:px-6">
            <span className="font-heading text-base font-extrabold text-foreground tracking-tight leading-none">
              {formatDateLong(group.date)}
            </span>
            <span className="ml-auto font-mono text-[10px] text-faint">
              {group.events.length} event{group.events.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Event cards */}
          {group.events.map((event) => (
            <EventCard key={event.uid} event={event} onOpen={onOpenEvent} />
          ))}
        </div>
      ))}


    </div>
  );
}
