import type { DateGroup, EventCategory, GotovoEvent } from './types';

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

/**
 * Total calendar days an event spans: 1 for same-day events, `n` when
 * `endsAt` is set (inclusive of the final day).
 */
export const eventDurationDays = (event: GotovoEvent): number =>
  event.endsAt ? daysBetween(event.startsAt, event.endsAt) + 1 : 1;

/**
 * Backend category enum (9-val, Decision 0001) → category hue.
 * The redesign uses colour only as a scanning aid: a bar on feed rows and a
 * dot on chips — never tinted surfaces.
 */
const CATEGORY_COLORS: Record<EventCategory, string> = {
  HIKING: 'var(--teal)',
  SPORTS: 'var(--teal)',
  TRIP: 'var(--teal)',
  PARTY: 'var(--violet)',
  ENTERTAINMENT: 'var(--violet)',
  WORKSHOP: 'var(--rose)',
  CULTURE: 'var(--rose)',
  EDUCATION: 'var(--blue)',
  IT_NETWORKING: 'var(--blue)',
};

export const getCategoryColor = (category: EventCategory): string =>
  CATEGORY_COLORS[category] ?? 'var(--muted-foreground)';

/** YYYY-MM-DD slice of an ISO datetime. Backend composes startsAt in Europe/Belgrade, so the slice is the local calendar date. */
export const isoDateKey = (iso: string): string => iso.slice(0, 10);

const groupByStartDate = (events: GotovoEvent[]): DateGroup[] => {
  const grouped = new Map<string, DateGroup>();
  for (const event of events) {
    const key = isoDateKey(event.startsAt);
    let group = grouped.get(key);
    if (!group) {
      group = { key, events: [] };
      grouped.set(key, group);
    }
    group.events.push(event);
  }
  return [...grouped.values()];
};

/** Group events by start date for the Timeline view. */
export const groupEventsByDate = (events: GotovoEvent[]): DateGroup[] =>
  groupByStartDate([...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));

/** Group events by recency (createdAt desc) for the "Recently added" view. */
export const groupEventsByRecency = (events: GotovoEvent[]): DateGroup[] =>
  groupByStartDate([...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
