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
  startDate: new Date('2026-05-01T00:00:00Z'),
  startTime: '10:00',
  cat: 'Adventure',
  city: 'Novi Sad',
  tags: [],
  createdAt: new Date('2026-04-30T00:00:00Z'),
  sourceCount: 1,
  ...overrides,
});

describe('daysBetween', () => {
  it('returns 0 for identical dates', () => {
    const d = new Date('2026-05-01T00:00:00Z');
    expect(daysBetween(d, d)).toBe(0);
  });

  it('returns 7 for one-week diff', () => {
    const start = new Date('2026-05-01T00:00:00Z');
    const end = new Date('2026-05-08T00:00:00Z');
    expect(daysBetween(start, end)).toBe(7);
  });

  it('returns negative for end < start', () => {
    const start = new Date('2026-05-08T00:00:00Z');
    const end = new Date('2026-05-01T00:00:00Z');
    expect(daysBetween(start, end)).toBe(-7);
  });

  it('handles DST boundary (Europe/Belgrade spring forward)', () => {
    const before = new Date('2026-03-28T00:00:00Z');
    const after = new Date('2026-03-30T00:00:00Z');
    expect(daysBetween(before, after)).toBe(2);
  });
});

describe('isNewEvent', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-05-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true for event created 1h before now', () => {
    const event = makeEvent({ createdAt: new Date('2026-05-01T11:00:00Z') });
    expect(isNewEvent(event)).toBe(true);
  });

  it('returns false for event created 25h before now', () => {
    const event = makeEvent({ createdAt: new Date('2026-04-30T11:00:00Z') });
    expect(isNewEvent(event)).toBe(false);
  });

  it('returns false for event created in the future', () => {
    const event = makeEvent({ createdAt: new Date('2026-05-02T00:00:00Z') });
    expect(isNewEvent(event)).toBe(false);
  });

  it('accepts explicit now as number', () => {
    const event = makeEvent({ createdAt: new Date('2026-05-01T11:00:00Z') });
    expect(isNewEvent(event, 1777636800000)).toBe(true);
  });

  it('accepts explicit now as Date', () => {
    const event = makeEvent({ createdAt: new Date('2026-05-01T11:00:00Z') });
    expect(isNewEvent(event, new Date('2026-05-01T12:00:00Z'))).toBe(true);
  });

  it('returns true at exactly 23h59m59s', () => {
    const event = makeEvent({ createdAt: new Date('2026-05-01T12:00:00.001Z') });
    expect(isNewEvent(event, new Date('2026-05-02T11:59:59.999Z'))).toBe(true);
  });

  it('returns false at exactly 24h', () => {
    const event = makeEvent({ createdAt: new Date('2026-05-01T12:00:00Z') });
    expect(isNewEvent(event, new Date('2026-05-02T12:00:00Z'))).toBe(false);
  });
});

describe('getCategoryStyle', () => {
  const categories: EventCategory[] = [
    'Music',
    'Adventure',
    'Food & Drink',
    'Education',
    'Art',
    'Wellness',
  ];

  it('returns a mapped style for each known category', () => {
    for (const cat of categories) {
      const style = getCategoryStyle(cat);
      expect(style).toHaveProperty('color');
      expect(style).toHaveProperty('highlight');
      expect(style).toHaveProperty('border');
    }
  });

  it('returns default style for unknown category', () => {
    const style = getCategoryStyle('NonExistent' as EventCategory);
    expect(style.color).toBe('var(--muted-foreground)');
    expect(style.highlight).toBe('var(--offset)');
    expect(style.border).toBe('var(--border)');
  });

  it('returns distinct styles for Music vs Adventure', () => {
    const music = getCategoryStyle('Music');
    const adventure = getCategoryStyle('Adventure');
    expect(music.color).not.toBe(adventure.color);
  });
});

describe('getPriceStyle', () => {
  it('returns faint color for undefined price', () => {
    const style = getPriceStyle(undefined);
    expect(style.color).toBe('var(--faint)');
    expect(style.highlight).toBe('transparent');
    expect(style.border).toBe('var(--divider)');
  });

  it('returns green color for Free', () => {
    const style = getPriceStyle('Free');
    expect(style.color).toBe('var(--green)');
    expect(style.highlight).toBe('var(--green-highlight)');
    expect(style.border).toBe('var(--green-border)');
  });

  it('returns muted style for a paid price string', () => {
    const style = getPriceStyle('500 RSD');
    expect(style.color).toBe('var(--muted-foreground)');
    expect(style.highlight).toBe('var(--offset)');
    expect(style.border).toBe('var(--border)');
  });

  it('returns faint style for empty string (falsy)', () => {
    const style = getPriceStyle('');
    expect(style.color).toBe('var(--faint)');
  });
});

describe('groupEventsByDate', () => {
  it('returns empty for empty input', () => {
    expect(groupEventsByDate([])).toEqual([]);
  });

  it('returns single group for single event', () => {
    const events = [makeEvent()];
    const result = groupEventsByDate(events);
    expect(result).toHaveLength(1);
    expect(result[0]?.events).toHaveLength(1);
  });

  it('groups multiple events on same date into one group', () => {
    const events = [
      makeEvent({ uid: 'evt_1', startTime: '10:00' }),
      makeEvent({ uid: 'evt_2', startTime: '14:00' }),
    ];
    const result = groupEventsByDate(events);
    expect(result).toHaveLength(1);
    expect(result[0]?.events).toHaveLength(2);
  });

  it('sorts groups by date ascending', () => {
    const events = [
      makeEvent({ uid: 'evt_1', startDate: new Date('2026-05-03T00:00:00Z') }),
      makeEvent({ uid: 'evt_2', startDate: new Date('2026-05-01T00:00:00Z') }),
      makeEvent({ uid: 'evt_3', startDate: new Date('2026-05-02T00:00:00Z') }),
    ];
    const result = groupEventsByDate(events);
    expect(result).toHaveLength(3);
    expect(result[0]?.date.toISOString().startsWith('2026-05-01')).toBe(true);
    expect(result[1]?.date.toISOString().startsWith('2026-05-02')).toBe(true);
    expect(result[2]?.date.toISOString().startsWith('2026-05-03')).toBe(true);
  });

  it('sorts events by startTime within same date', () => {
    const events = [
      makeEvent({ uid: 'evt_1', startTime: '14:00' }),
      makeEvent({ uid: 'evt_2', startTime: '09:00' }),
      makeEvent({ uid: 'evt_3', startTime: '11:00' }),
    ];
    const result = groupEventsByDate(events);
    expect(result[0]?.events.map((e) => e.uid)).toEqual(['evt_2', 'evt_3', 'evt_1']);
  });

  it('sorts events with undefined startTime last within their day', () => {
    const evt2: GotovoEvent = {
      uid: 'evt_2',
      title: 'Untitled',
      startDate: new Date('2026-05-01T00:00:00Z'),
      cat: 'Adventure',
      city: 'Novi Sad',
      tags: [],
      createdAt: new Date('2026-04-30T00:00:00Z'),
      sourceCount: 1,
    };
    const events = [
      makeEvent({ uid: 'evt_1', startTime: '10:00' }),
      evt2,
      makeEvent({ uid: 'evt_3', startTime: '09:00' }),
    ];
    const result = groupEventsByDate(events);
    expect(result[0]?.events.map((e) => e.uid)).toEqual(['evt_3', 'evt_1', 'evt_2']);
  });
});

describe('groupEventsByRecency', () => {
  it('returns empty for empty input', () => {
    expect(groupEventsByRecency([])).toEqual([]);
  });

  it('sorts by createdAt descending', () => {
    const events = [
      makeEvent({ uid: 'evt_1', createdAt: new Date('2026-04-28T00:00:00Z') }),
      makeEvent({ uid: 'evt_2', createdAt: new Date('2026-04-30T00:00:00Z') }),
      makeEvent({ uid: 'evt_3', createdAt: new Date('2026-04-29T00:00:00Z') }),
    ];
    const result = groupEventsByRecency(events);
    expect(result[0]?.events[0]?.uid).toBe('evt_2');
    expect(result[0]?.events[1]?.uid).toBe('evt_3');
    expect(result[0]?.events[2]?.uid).toBe('evt_1');
  });

  it('groups by startDate', () => {
    const events = [
      makeEvent({
        uid: 'evt_1',
        startDate: new Date('2026-05-01T00:00:00Z'),
        createdAt: new Date('2026-04-30T00:00:00Z'),
      }),
      makeEvent({
        uid: 'evt_2',
        startDate: new Date('2026-05-02T00:00:00Z'),
        createdAt: new Date('2026-04-29T00:00:00Z'),
      }),
    ];
    const result = groupEventsByRecency(events);
    expect(result).toHaveLength(2);
    expect(result[0]?.events[0]?.uid).toBe('evt_1');
    expect(result[1]?.events[0]?.uid).toBe('evt_2');
  });
});

describe('filterEvents', () => {
  const allValue = 'All';

  it('returns all events when no filters active', () => {
    const events = [makeEvent({ uid: 'evt_1' }), makeEvent({ uid: 'evt_2' })];
    const result = filterEvents(events, allValue, allValue, new Set(), allValue);
    expect(result).toHaveLength(2);
  });

  it('filters by category only', () => {
    const events = [
      makeEvent({ uid: 'evt_1', cat: 'Music' }),
      makeEvent({ uid: 'evt_2', cat: 'Adventure' }),
      makeEvent({ uid: 'evt_3', cat: 'Music' }),
    ];
    const result = filterEvents(events, 'Music', allValue, new Set(), allValue);
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.cat === 'Music')).toBe(true);
  });

  it('filters by city only', () => {
    const events = [
      makeEvent({ uid: 'evt_1', city: 'Belgrade' }),
      makeEvent({ uid: 'evt_2', city: 'Novi Sad' }),
    ];
    const result = filterEvents(events, allValue, 'Belgrade', new Set(), allValue);
    expect(result).toHaveLength(1);
    expect(result[0]?.city).toBe('Belgrade');
  });

  it('filters by single tag', () => {
    const events = [
      makeEvent({ uid: 'evt_1', tags: ['outdoor', 'music'] }),
      makeEvent({ uid: 'evt_2', tags: ['food'] }),
    ];
    const result = filterEvents(events, allValue, allValue, new Set(['outdoor']), allValue);
    expect(result).toHaveLength(1);
    expect(result[0]?.uid).toBe('evt_1');
  });

  it('filters by multiple tags (OR semantics)', () => {
    const events = [
      makeEvent({ uid: 'evt_1', tags: ['outdoor'] }),
      makeEvent({ uid: 'evt_2', tags: ['food'] }),
      makeEvent({ uid: 'evt_3', tags: ['music'] }),
    ];
    const result = filterEvents(events, allValue, allValue, new Set(['outdoor', 'food']), allValue);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.uid).sort()).toEqual(['evt_1', 'evt_2']);
  });

  it('combines all three filters (AND semantics)', () => {
    const events = [
      makeEvent({ uid: 'evt_1', cat: 'Music', city: 'Belgrade', tags: ['outdoor'] }),
      makeEvent({ uid: 'evt_2', cat: 'Music', city: 'Novi Sad', tags: ['outdoor'] }),
      makeEvent({ uid: 'evt_3', cat: 'Adventure', city: 'Belgrade', tags: ['outdoor'] }),
      makeEvent({ uid: 'evt_4', cat: 'Music', city: 'Belgrade', tags: ['food'] }),
    ];
    const result = filterEvents(events, 'Music', 'Belgrade', new Set(['outdoor']), allValue);
    expect(result).toHaveLength(1);
    expect(result[0]?.uid).toBe('evt_1');
  });

  it('returns empty when no events match', () => {
    const events = [makeEvent({ cat: 'Music' })];
    const result = filterEvents(events, 'Adventure', allValue, new Set(), allValue);
    expect(result).toHaveLength(0);
  });
});
