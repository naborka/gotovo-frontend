import { describe, expect, it } from 'vitest';
import {
  belgradeDateKey,
  formatDayMonth,
  formatTime,
  formatWeekdayDayMonth,
  formatWeekdayLong,
  isWeekendInBelgrade,
  relativeDayKind,
} from '@/lib/datetime';

describe('formatTime', () => {
  it('renders 24h time in Europe/Belgrade', () => {
    expect(formatTime('2026-04-29T06:30:00+02:00', 'ru')).toBe('06:30');
  });

  it('shifts a UTC input into Europe/Belgrade time', () => {
    expect(formatTime('2026-04-29T04:30:00Z', 'ru')).toBe('06:30');
  });
});

describe('formatTime — DST spring-forward (Europe/Belgrade)', () => {
  it('does not crash on the gap hour (2026-03-29)', () => {
    // Europe/Belgrade jumps from 02:00 CET to 03:00 CEST on last Sunday of March.
    // 2026-03-29T01:00:00Z = 02:00 CET = 03:00 CEST after jump.
    const t = formatTime('2026-03-29T01:00:00Z', 'ru');
    expect(['02:00', '03:00']).toContain(t);
  });
});

describe('belgradeDateKey', () => {
  it('returns the Belgrade calendar date for a UTC instant near midnight', () => {
    // 23:30Z on the 29th is already 01:30 on the 30th in Belgrade (CEST).
    expect(belgradeDateKey('2026-04-29T23:30:00Z')).toBe('2026-04-30');
  });

  it('keeps the local calendar date for an offset input', () => {
    expect(belgradeDateKey('2026-04-29T06:30:00+02:00')).toBe('2026-04-29');
  });
});

describe('relativeDayKind', () => {
  // Timezone-pinned: "now" is fixed to 2026-07-20T10:00:00Z (12:00 in Belgrade).
  const now = new Date('2026-07-20T10:00:00Z');

  it('detects today', () => {
    expect(relativeDayKind('2026-07-20T21:00:00+02:00', now)).toBe('today');
  });

  it('detects tomorrow', () => {
    expect(relativeDayKind('2026-07-21T00:30:00+02:00', now)).toBe('tomorrow');
  });

  it('returns other for later dates and for yesterday', () => {
    expect(relativeDayKind('2026-07-25T10:00:00+02:00', now)).toBe('other');
    expect(relativeDayKind('2026-07-19T10:00:00+02:00', now)).toBe('other');
  });

  it('uses the Belgrade calendar day, not the UTC one', () => {
    // 22:30Z on the 20th = 00:30 on the 21st in Belgrade → tomorrow.
    expect(relativeDayKind('2026-07-20T22:30:00Z', now)).toBe('tomorrow');
  });

  it('accepts bare YYYY-MM-DD group keys', () => {
    expect(relativeDayKind('2026-07-20', now)).toBe('today');
    expect(relativeDayKind('2026-07-21', now)).toBe('tomorrow');
  });
});

describe('group header formatting', () => {
  it('formats full weekday', () => {
    expect(formatWeekdayLong('2026-07-25T10:00:00+02:00', 'en')).toBe('Saturday');
  });

  it('formats "20 July" style day-month', () => {
    expect(formatDayMonth('2026-07-20T10:00:00+02:00', 'en')).toBe('20 July');
  });

  it('formats "Mon 20 July" style weekday-day-month', () => {
    expect(formatWeekdayDayMonth('2026-07-20T10:00:00+02:00', 'en')).toBe('Mon 20 July');
  });
});

describe('isWeekendInBelgrade', () => {
  it('is true for Saturday and Sunday, false for Monday', () => {
    expect(isWeekendInBelgrade('2026-07-25')).toBe(true);
    expect(isWeekendInBelgrade('2026-07-26')).toBe(true);
    expect(isWeekendInBelgrade('2026-07-20')).toBe(false);
  });

  it('judges the weekday in Belgrade, not UTC', () => {
    // Friday 23:00Z is already Saturday 01:00 in Belgrade (CEST).
    expect(isWeekendInBelgrade('2026-07-24T23:00:00Z')).toBe(true);
  });
});
