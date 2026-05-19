/**
 * Core type definitions.
 *
 * Domain types come straight from the Zod schemas in `lib/api/schemas`.
 * Wire shape IS app shape — no adapter layer.
 */

export type {
  Category as EventCategory,
  City,
  Event as GotovoEvent,
  EventDetail as GotovoEventDetail,
  EventStatus,
  EventsPage,
  Facets,
  Health,
  Language,
  Price,
  Problem,
  SourceSummary,
} from '@/lib/api/schemas';

/** Tab options for feed view */
export type TabType = 'timeline' | 'recent';

/** Grouped events by date (key = YYYY-MM-DD in Europe/Belgrade). */
export interface DateGroup {
  /** ISO datetime of the first event in the group (used for header display). */
  isoDate: string;
  events: import('@/lib/api/schemas').Event[];
}

/** Category style configuration */
export interface CategoryStyle {
  color: string;
  highlight: string;
  border: string;
}

/** Price style configuration */
export interface PriceStyle {
  color: string;
  highlight: string;
  border: string;
}
