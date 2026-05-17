import type { CategoryStyle, DateGroup, EventCategory, GotovoEvent, PriceStyle } from './types';

/**
 * Event utility functions.
 * Pure functions following functional programming principles.
 */

const WEEK_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** Format date as "Wednesday, 29 April" */
export const formatDateLong = (date: Date): string =>
  `${WEEK_DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;

/** Format date as "29 Apr" */
export const formatDateShort = (date: Date): string =>
  `${date.getDate()} ${(MONTHS[date.getMonth()] ?? '').slice(0, 3)}`;

/** Calculate days between two dates */
export const daysBetween = (start: Date, end: Date): number =>
  Math.round((end.getTime() - start.getTime()) / 86_400_000);

const ONE_DAY_MS = 86_400_000;

/**
 * Returns true if the event was created within the last 24 hours
 * relative to `now`. Pure: callers control time.
 */
export const isNewEvent = (event: GotovoEvent, now: Date | number = Date.now()): boolean => {
  const reference = typeof now === 'number' ? now : now.getTime();
  const diff = reference - event.createdAt.getTime();
  return diff >= 0 && diff < ONE_DAY_MS;
};

/** Category to style mapping */
const CATEGORY_STYLES: Record<EventCategory, CategoryStyle> = {
  Music: {
    color: 'var(--primary)',
    highlight: 'var(--primary-highlight)',
    border: 'var(--primary-border)',
  },
  Adventure: {
    color: 'var(--teal)',
    highlight: 'var(--teal-highlight)',
    border: 'var(--teal-border)',
  },
  'Food & Drink': {
    color: 'var(--green)',
    highlight: 'var(--green-highlight)',
    border: 'var(--green-border)',
  },
  Education: {
    color: 'var(--blue)',
    highlight: 'var(--blue-highlight)',
    border: 'var(--blue-border)',
  },
  Art: {
    color: 'var(--rose)',
    highlight: 'var(--rose-highlight)',
    border: 'var(--rose-border)',
  },
  Wellness: {
    color: 'var(--teal)',
    highlight: 'var(--teal-highlight)',
    border: 'var(--teal-border)',
  },
};

/** Default style for unknown categories */
const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  color: 'var(--muted-foreground)',
  highlight: 'var(--offset)',
  border: 'var(--border)',
};

/** Get style for a category */
export const getCategoryStyle = (category: EventCategory): CategoryStyle =>
  CATEGORY_STYLES[category] ?? DEFAULT_CATEGORY_STYLE;

/** Get style for price display */
export const getPriceStyle = (price: string | undefined): PriceStyle => {
  if (!price) {
    return {
      color: 'var(--faint)',
      highlight: 'transparent',
      border: 'var(--divider)',
    };
  }
  if (price === 'Free') {
    return {
      color: 'var(--green)',
      highlight: 'var(--green-highlight)',
      border: 'var(--green-border)',
    };
  }
  return {
    color: 'var(--muted-foreground)',
    highlight: 'var(--offset)',
    border: 'var(--border)',
  };
};

/** Group and sort events by date for Timeline view */
export const groupEventsByDate = (events: GotovoEvent[]): DateGroup[] => {
  const sorted = [...events].sort((a, b) => {
    const dateDiff = a.startDate.getTime() - b.startDate.getTime();
    if (dateDiff !== 0) return dateDiff;
    // Sort by time within same date
    const timeA = a.startTime ?? '99:99';
    const timeB = b.startTime ?? '99:99';
    return timeA.localeCompare(timeB);
  });

  const grouped = new Map<string, DateGroup>();

  for (const event of sorted) {
    const key = event.startDate.toDateString();
    let group = grouped.get(key);
    if (!group) {
      group = { date: event.startDate, events: [] };
      grouped.set(key, group);
    }
    group.events.push(event);
  }

  return [...grouped.values()];
};

/** Group events by recency for Recently Added view */
export const groupEventsByRecency = (events: GotovoEvent[]): DateGroup[] => {
  const sorted = [...events].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const grouped = new Map<string, DateGroup>();

  for (const event of sorted) {
    const key = event.startDate.toDateString();
    let group = grouped.get(key);
    if (!group) {
      group = { date: event.startDate, events: [] };
      grouped.set(key, group);
    }
    group.events.push(event);
  }

  return [...grouped.values()];
};

/** Filter events based on active filters */
export const filterEvents = (
  events: GotovoEvent[],
  category: string,
  city: string,
  tags: Set<string>,
  allValue: string,
): GotovoEvent[] => {
  return events.filter((event) => {
    if (category !== allValue && event.cat !== category) return false;
    if (city !== allValue && event.city !== city) return false;
    if (tags.size > 0 && !event.tags.some((t) => tags.has(t))) return false;
    return true;
  });
};
