import { describe, expect, it } from 'vitest';
import { buildIcs, icsFilename, mapsUrl } from '@/lib/calendar';
import type { GotovoEvent } from '@/lib/types';

const makeEvent = (overrides: Partial<GotovoEvent> = {}): GotovoEvent => ({
  uid: 'evt_1',
  title: 'Sunrise hike',
  description: 'Easy loop; bring water',
  category: 'HIKING',
  tags: [],
  city: 'novi-sad',
  location: 'Stražilovo trailhead',
  startsAt: '2026-07-25T07:30:00+02:00',
  endsAt: null,
  allDay: false,
  timezone: 'Europe/Belgrade',
  price: { kind: 'free', amount: null, currency: null, display: 'Free' },
  source: { url: 'https://t.me/example/1', count: 1 },
  language: 'ru',
  status: 'live',
  createdAt: '2026-07-20T00:00:00Z',
  updatedAt: '2026-07-20T00:00:00Z',
  ...overrides,
});

const NOW = new Date('2026-07-20T10:00:00Z');

describe('buildIcs', () => {
  it('produces a minimal VEVENT with UTC start for a timed event', () => {
    const ics = buildIcs(makeEvent(), NOW);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('UID:evt_1@gotovo.app');
    expect(ics).toContain('DTSTAMP:20260720T100000Z');
    // 07:30+02:00 → 05:30Z
    expect(ics).toContain('DTSTART:20260725T053000Z');
    expect(ics).toContain('SUMMARY:Sunrise hike');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('uses CRLF line endings', () => {
    const ics = buildIcs(makeEvent(), NOW);
    expect(ics).toContain('\r\n');
    expect(ics.replaceAll('\r\n', '')).not.toContain('\n');
  });

  it('renders all-day events as VALUE=DATE with exclusive end', () => {
    const ics = buildIcs(makeEvent({ allDay: true, startsAt: '2026-07-25T00:00:00+02:00' }), NOW);
    expect(ics).toContain('DTSTART;VALUE=DATE:20260725');
    expect(ics).toContain('DTEND;VALUE=DATE:20260726');
  });

  it('renders multi-day all-day events with day-after-last-day DTEND', () => {
    const ics = buildIcs(
      makeEvent({
        allDay: true,
        startsAt: '2026-07-25T00:00:00+02:00',
        endsAt: '2026-07-26T00:00:00+02:00',
      }),
      NOW,
    );
    expect(ics).toContain('DTSTART;VALUE=DATE:20260725');
    expect(ics).toContain('DTEND;VALUE=DATE:20260727');
  });

  it('includes DTEND for timed events with endsAt', () => {
    const ics = buildIcs(makeEvent({ endsAt: '2026-07-25T10:00:00+02:00' }), NOW);
    expect(ics).toContain('DTEND:20260725T080000Z');
  });

  it('escapes commas, semicolons and newlines in text fields', () => {
    const ics = buildIcs(
      makeEvent({ title: 'a,b;c', description: 'line1\nline2', location: null }),
      NOW,
    );
    expect(ics).toContain('SUMMARY:a\\,b\\;c');
    expect(ics).toContain('DESCRIPTION:line1\\nline2');
  });

  it('includes the source URL when present', () => {
    expect(buildIcs(makeEvent(), NOW)).toContain('URL:https://t.me/example/1');
  });

  it('folds lines longer than 75 octets', () => {
    const ics = buildIcs(makeEvent({ title: 'x'.repeat(200) }), NOW);
    for (const line of ics.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });
});

describe('icsFilename', () => {
  it('slugifies the title', () => {
    expect(icsFilename(makeEvent({ title: 'Sunrise hike: Fruška Gora!' }))).toBe(
      'sunrise-hike-fruska-gora.ics',
    );
  });

  it('falls back to the uid for untitled events', () => {
    expect(icsFilename(makeEvent({ title: '™©' }))).toBe('evt_1.ics');
  });
});

describe('mapsUrl', () => {
  it('builds a Google Maps query from location and city', () => {
    expect(mapsUrl('Startit Centar, Savska 5', 'Belgrade')).toBe(
      'https://maps.google.com/?q=Startit%20Centar%2C%20Savska%205%2C%20Belgrade%2C%20Serbia',
    );
  });

  it('omits a missing location', () => {
    expect(mapsUrl(null, 'Belgrade')).toBe('https://maps.google.com/?q=Belgrade%2C%20Serbia');
  });
});
