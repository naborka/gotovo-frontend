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

/** Grouped events by date. */
export interface DateGroup {
  /**
   * YYYY-MM-DD calendar date in Europe/Belgrade — quick-jump anchor key and
   * the date the header formatters render.
   */
  key: string;
  events: import('@/lib/api/schemas').Event[];
}
