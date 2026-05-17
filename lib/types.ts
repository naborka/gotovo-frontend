/**
 * Core type definitions for Gotovo event discovery app.
 * Following TypeScript best practices with strict typing.
 */

/** Event category enumeration */
export type EventCategory =
  | 'Music'
  | 'Adventure'
  | 'Food & Drink'
  | 'Education'
  | 'Art'
  | 'Wellness';

/** Event data model */
export interface GotovoEvent {
  /** Unique identifier */
  uid: string;
  /** Event title */
  title: string;
  /** Optional detailed description */
  description?: string;
  /** Start date of the event */
  startDate: Date;
  /** End date for multi-day events */
  endDate?: Date;
  /** Start time in HH:MM format */
  startTime?: string;
  /** End time in HH:MM format */
  endTime?: string;
  /** Event category */
  cat: EventCategory;
  /** Specific location/venue */
  loc?: string;
  /** City name */
  city?: string;
  /** Price info: null = unknown, 'Free' = free, otherwise price string */
  price?: string;
  /** Tags for filtering */
  tags: string[];
  /** When the event was added to the system */
  createdAt: Date;
  /** Number of sources confirming this event */
  sourceCount: number;
  /** Original source URL */
  sourceUrl?: string;
}

/** Tab options for feed view */
export type TabType = 'timeline' | 'recent';

/** Filter state */
export interface FilterState {
  category: string;
  city: string;
  tags: Set<string>;
}

/** Grouped events by date */
export interface DateGroup {
  date: Date;
  events: GotovoEvent[];
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
