import type { CategoryStyle, DateGroup, EventCategory, GotovoEvent, PriceStyle } from './types';

const ONE_DAY_MS = 86_400_000;

/** Days between two ISO datetimes (rounded). */
export const daysBetween = (startIso: string, endIso: string): number =>
  Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / ONE_DAY_MS);

/**
 * Returns true when `event.createdAt` is within the last 24h of `now`.
 * Pure: callers control time.
 */
export const isNewEvent = (event: GotovoEvent, now: Date | number = Date.now()): boolean => {
  const reference = typeof now === 'number' ? now : now.getTime();
  const diff = reference - new Date(event.createdAt).getTime();
  return diff >= 0 && diff < ONE_DAY_MS;
};

/** Backend category enum (9-val, Decision 0001) → pill style. */
const CATEGORY_STYLES: Record<EventCategory, CategoryStyle> = {
  HIKING: {
    color: 'var(--teal)',
    highlight: 'var(--teal-highlight)',
    border: 'var(--teal-border)',
  },
  SPORTS: {
    color: 'var(--teal)',
    highlight: 'var(--teal-highlight)',
    border: 'var(--teal-border)',
  },
  PARTY: {
    color: 'var(--primary)',
    highlight: 'var(--primary-highlight)',
    border: 'var(--primary-border)',
  },
  WORKSHOP: {
    color: 'var(--rose)',
    highlight: 'var(--rose-highlight)',
    border: 'var(--rose-border)',
  },
  EDUCATION: {
    color: 'var(--blue)',
    highlight: 'var(--blue-highlight)',
    border: 'var(--blue-border)',
  },
  TRIP: {
    color: 'var(--teal)',
    highlight: 'var(--teal-highlight)',
    border: 'var(--teal-border)',
  },
  CULTURE: {
    color: 'var(--rose)',
    highlight: 'var(--rose-highlight)',
    border: 'var(--rose-border)',
  },
  ENTERTAINMENT: {
    color: 'var(--primary)',
    highlight: 'var(--primary-highlight)',
    border: 'var(--primary-border)',
  },
  IT_NETWORKING: {
    color: 'var(--blue)',
    highlight: 'var(--blue-highlight)',
    border: 'var(--blue-border)',
  },
};

const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  color: 'var(--muted-foreground)',
  highlight: 'var(--offset)',
  border: 'var(--border)',
};

export const getCategoryStyle = (category: EventCategory): CategoryStyle =>
  CATEGORY_STYLES[category] ?? DEFAULT_CATEGORY_STYLE;

/** Pill style for the structured Price object. */
export const getPriceStyle = (price: GotovoEvent['price']): PriceStyle => {
  switch (price.kind) {
    case 'free':
      return {
        color: 'var(--green)',
        highlight: 'var(--green-highlight)',
        border: 'var(--green-border)',
      };
    case 'paid':
      return {
        color: 'var(--muted-foreground)',
        highlight: 'var(--offset)',
        border: 'var(--border)',
      };
    default:
      return {
        color: 'var(--faint)',
        highlight: 'transparent',
        border: 'var(--divider)',
      };
  }
};

/** YYYY-MM-DD slice of an ISO datetime. Backend composes startsAt in Europe/Belgrade, so the slice is the local calendar date. */
const isoDateKey = (iso: string): string => iso.slice(0, 10);

/** Group events by start date for the Timeline view. */
export const groupEventsByDate = (events: GotovoEvent[]): DateGroup[] => {
  const sorted = [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const grouped = new Map<string, DateGroup>();
  for (const event of sorted) {
    const key = isoDateKey(event.startsAt);
    let group = grouped.get(key);
    if (!group) {
      group = { isoDate: event.startsAt, events: [] };
      grouped.set(key, group);
    }
    group.events.push(event);
  }
  return [...grouped.values()];
};

/** Group events by recency (createdAt desc) for the "Recently Added" view. */
export const groupEventsByRecency = (events: GotovoEvent[]): DateGroup[] => {
  const sorted = [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const grouped = new Map<string, DateGroup>();
  for (const event of sorted) {
    const key = isoDateKey(event.startsAt);
    let group = grouped.get(key);
    if (!group) {
      group = { isoDate: event.startsAt, events: [] };
      grouped.set(key, group);
    }
    group.events.push(event);
  }
  return [...grouped.values()];
};

/** Filter events against the (category, city, tags) tuple. */
export const filterEvents = (
  events: GotovoEvent[],
  category: string,
  city: string,
  tags: Set<string>,
  allValue: string,
): GotovoEvent[] =>
  events.filter((event) => {
    if (category !== allValue && event.category !== category) return false;
    if (city !== allValue && event.city !== city) return false;
    if (tags.size > 0 && !event.tags.some((t) => tags.has(t))) return false;
    return true;
  });
