import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  daysBetween,
  filterEvents,
  getCategoryStyle,
  getPriceStyle,
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

describe('getCategoryStyle', () => {
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

  it('returns a style for every known category', () => {
    for (const cat of categories) {
      const s = getCategoryStyle(cat);
      expect(s).toHaveProperty('color');
      expect(s).toHaveProperty('highlight');
      expect(s).toHaveProperty('border');
    }
  });

  it('falls back to default for unknown', () => {
    const s = getCategoryStyle('NOPE' as EventCategory);
    expect(s.color).toBe('var(--muted-foreground)');
  });
});

describe('getPriceStyle', () => {
  it('green for free', () => {
    expect(getPriceStyle({ kind: 'free', amount: null, currency: null, display: 'F' }).color).toBe(
      'var(--green)',
    );
  });

  it('muted for paid', () => {
    expect(
      getPriceStyle({ kind: 'paid', amount: 1000, currency: 'RSD', display: '1000 RSD' }).color,
    ).toBe('var(--muted-foreground)');
  });

  it('faint for unknown', () => {
    expect(
      getPriceStyle({ kind: 'unknown', amount: null, currency: null, display: 'TBA' }).color,
    ).toBe('var(--faint)');
  });
});

describe('groupEventsByDate', () => {
  it('empty for empty input', () => {
    expect(groupEventsByDate([])).toEqual([]);
  });

  it('groups by YYYY-MM-DD slice of startsAt', () => {
    const events = [
      makeEvent({ uid: 'a', startsAt: '2026-05-01T10:00:00+02:00' }),
      makeEvent({ uid: 'b', startsAt: '2026-05-01T18:00:00+02:00' }),
      makeEvent({ uid: 'c', startsAt: '2026-05-02T10:00:00+02:00' }),
    ];
    const result = groupEventsByDate(events);
    expect(result).toHaveLength(2);
    expect(result[0]?.events.map((e) => e.uid)).toEqual(['a', 'b']);
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

describe('filterEvents', () => {
  const ALL = 'all';

  it('returns all events with no filters', () => {
    const events = [makeEvent({ uid: 'a' }), makeEvent({ uid: 'b' })];
    expect(filterEvents(events, ALL, ALL, new Set(), ALL)).toHaveLength(2);
  });

  it('filters by category', () => {
    const events = [
      makeEvent({ uid: 'a', category: 'HIKING' }),
      makeEvent({ uid: 'b', category: 'PARTY' }),
    ];
    expect(filterEvents(events, 'PARTY', ALL, new Set(), ALL)).toHaveLength(1);
  });

  it('filters by city', () => {
    const events = [
      makeEvent({ uid: 'a', city: 'belgrade' }),
      makeEvent({ uid: 'b', city: 'novi-sad' }),
    ];
    expect(filterEvents(events, ALL, 'belgrade', new Set(), ALL)).toHaveLength(1);
  });

  it('filters by tag (OR semantics)', () => {
    const events = [
      makeEvent({ uid: 'a', tags: ['Outdoor'] }),
      makeEvent({ uid: 'b', tags: ['Indoor'] }),
      makeEvent({ uid: 'c', tags: ['Music'] }),
    ];
    const r = filterEvents(events, ALL, ALL, new Set(['Outdoor', 'Music']), ALL);
    expect(r.map((e) => e.uid).sort()).toEqual(['a', 'c']);
  });

  it('combines filters (AND)', () => {
    const events = [
      makeEvent({ uid: 'a', category: 'HIKING', city: 'novi-sad', tags: ['Outdoor'] }),
      makeEvent({ uid: 'b', category: 'HIKING', city: 'belgrade', tags: ['Outdoor'] }),
      makeEvent({ uid: 'c', category: 'HIKING', city: 'novi-sad', tags: ['Indoor'] }),
    ];
    const r = filterEvents(events, 'HIKING', 'novi-sad', new Set(['Outdoor']), ALL);
    expect(r.map((e) => e.uid)).toEqual(['a']);
  });
});
