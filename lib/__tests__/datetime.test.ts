import { describe, expect, it } from 'vitest';
import { formatDateLong, formatDateShort, formatTime, isSameDayInBelgrade } from '@/lib/datetime';

describe('formatDateLong', () => {
  it('renders Russian weekday + day + month', () => {
    expect(formatDateLong('2026-04-29T06:30:00+02:00', 'ru')).toMatch(/среда|апрел/iu);
  });

  it('renders English weekday + day + month', () => {
    expect(formatDateLong('2026-04-29T06:30:00+02:00', 'en')).toMatch(/Wednesday|April/i);
  });
});

describe('formatDateShort', () => {
  it('produces short Russian form', () => {
    expect(formatDateShort('2026-04-29T06:30:00+02:00', 'ru')).toMatch(/29.+апр/iu);
  });
});

describe('formatTime', () => {
  it('renders 24h time in Europe/Belgrade', () => {
    expect(formatTime('2026-04-29T06:30:00+02:00', 'ru')).toBe('06:30');
  });

  it('shifts a UTC input into Europe/Belgrade time', () => {
    expect(formatTime('2026-04-29T04:30:00Z', 'ru')).toBe('06:30');
  });
});

describe('isSameDayInBelgrade', () => {
  it('returns true for same-day inputs in different offsets', () => {
    expect(isSameDayInBelgrade('2026-04-29T01:00:00+02:00', '2026-04-29T22:00:00+02:00')).toBe(
      true,
    );
  });

  it('returns false for different days', () => {
    expect(isSameDayInBelgrade('2026-04-29T22:00:00+02:00', '2026-04-30T01:00:00+02:00')).toBe(
      false,
    );
  });

  it('groups by Belgrade calendar day even when browser is in UTC', () => {
    expect(isSameDayInBelgrade('2026-04-29T23:30:00Z', '2026-04-30T00:30:00Z')).toBe(true);
  });
});
