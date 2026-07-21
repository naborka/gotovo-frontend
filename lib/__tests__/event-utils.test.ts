import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  daysBetween,
  getCategoryColor,
  groupEventsByDate,
  groupEventsByRecency,
  isNewEvent,
} from '@/lib/event-utils';
import type { EventCategory, GotovoEvent } from '@/lib/types';

const makeEvent = (overrides: Partial<GotovoEvent> = {}): GotovoEvent => ({
  uid: 'evt_1',
  title: 'Untitled',
  description: null,
  category: 'HIKING',
  tags: [],
  city: 'novi-sad',
  location: null,
  startsAt: '2026-05-01T10:00:00+02:00',
  endsAt: null,
  allDay: false,
  timezone: 'Europe/Belgrade',
  price: { kind: 'free', amount: null, currency: null, display: 'Бесплатно' },
  source: { url: null, count: 1 },
  language: 'ru',
  status: 'live',
  createdAt: '2026-04-30T00:00:00Z',
  updatedAt: '2026-04-30T00:00:00Z',
  ...overrides,
});

describe('daysBetween', () => {
  it('returns 0 for identical ISO strings', () => {
    const iso = '2026-05-01T00:00:00Z';
    expect(daysBetween(iso, iso)).toBe(0);
  });

  it('returns 7 for one-week diff', () => {
    expect(daysBetween('2026-05-01T00:00:00Z', '2026-05-08T00:00:00Z')).toBe(7);
  });

  it('returns negative for end < start', () => {
    expect(daysBetween('2026-05-08T00:00:00Z', '2026-05-01T00:00:00Z')).toBe(-7);
  });

  it('handles DST boundary across Europe/Belgrade spring forward', () => {
    expect(daysBetween('2026-03-28T00:00:00Z', '2026-03-30T00:00:00Z')).toBe(2);
  });
});

describe('isNewEvent', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-05-01T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('true when created 1h ago', () => {
    const event = makeEvent({ createdAt: '2026-05-01T11:00:00Z' });
    expect(isNewEvent(event)).toBe(true);
  });

  it('false when created 25h ago', () => {
    const event = makeEvent({ createdAt: '2026-04-30T11:00:00Z' });
    expect(isNewEvent(event)).toBe(false);
  });

  it('false when created in the future', () => {
    const event = makeEvent({ createdAt: '2026-05-02T00:00:00Z' });
    expect(isNewEvent(event)).toBe(false);
  });

  it('accepts explicit now as Date', () => {
    const event = makeEvent({ createdAt: '2026-05-01T11:00:00Z' });
    expect(isNewEvent(event, new Date('2026-05-01T12:00:00Z'))).toBe(true);
  });

  it('boundary: just under 24h returns true', () => {
    const event = makeEvent({ createdAt: '2026-05-01T12:00:00.001Z' });
    expect(isNewEvent(event, new Date('2026-05-02T11:59:59.999Z'))).toBe(true);
  });

  it('boundary: exactly 24h returns false', () => {
    const event = makeEvent({ createdAt: '2026-05-01T12:00:00Z' });
    expect(isNewEvent(event, new Date('2026-05-02T12:00:00Z'))).toBe(false);
  });
});

describe('getCategoryColor', () => {
  const categories: EventCategory[] = [
    'HIKING',
    'SPORTS',
    'PARTY',
    'WORKSHOP',
    'EDUCATION',
    'TRIP',
    'CULTURE',
    'ENTERTAINMENT',
    'IT_NETWORKING',
  ];

  it('returns a CSS variable for every known category', () => {
    for (const cat of categories) {
      expect(getCategoryColor(cat)).toMatch(/^var\(--[a-z-]+\)$/);
    }
  });

  it('falls back to muted for unknown', () => {
    expect(getCategoryColor('NOPE' as EventCategory)).toBe('var(--muted-foreground)');
  });
});

describe('groupEventsByDate', () => {
  it('empty for empty input', () => {
    expect(groupEventsByDate([])).toEqual([]);
  });

  it('groups by YYYY-MM-DD slice of startsAt and exposes the key', () => {
    const events = [
      makeEvent({ uid: 'a', startsAt: '2026-05-01T10:00:00+02:00' }),
      makeEvent({ uid: 'b', startsAt: '2026-05-01T18:00:00+02:00' }),
      makeEvent({ uid: 'c', startsAt: '2026-05-02T10:00:00+02:00' }),
    ];
    const result = groupEventsByDate(events);
    expect(result).toHaveLength(2);
    expect(result[0]?.key).toBe('2026-05-01');
    expect(result[0]?.events.map((e) => e.uid)).toEqual(['a', 'b']);
    expect(result[1]?.key).toBe('2026-05-02');
    expect(result[1]?.events).toHaveLength(1);
  });

  it('sorts by startsAt ascending', () => {
    const events = [
      makeEvent({ uid: 'late', startsAt: '2026-05-03T10:00:00+02:00' }),
      makeEvent({ uid: 'early', startsAt: '2026-05-01T10:00:00+02:00' }),
    ];
    const result = groupEventsByDate(events);
    expect(result[0]?.events[0]?.uid).toBe('early');
  });
});

describe('groupEventsByRecency', () => {
  it('orders newest createdAt first', () => {
    const events = [
      makeEvent({ uid: 'old', createdAt: '2026-04-28T00:00:00Z' }),
      makeEvent({ uid: 'new', createdAt: '2026-04-30T00:00:00Z' }),
    ];
    const result = groupEventsByRecency(events);
    expect(result[0]?.events[0]?.uid).toBe('new');
  });
});
