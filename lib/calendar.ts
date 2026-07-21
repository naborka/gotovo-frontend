import { isoDateKey } from './event-utils';
import type { GotovoEvent } from './types';

/**
 * ICS (RFC 5545) export + map-link helpers for the event detail actions.
 * Pure string builders — download wiring lives in the component layer.
 */

/** `\` `;` `,` and newlines must be escaped in ICS TEXT values. */
const escapeText = (value: string): string =>
  value
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll('\r\n', '\\n')
    .replaceAll('\n', '\\n');

const encoder = new TextEncoder();

/** RFC 5545 §3.1: content lines fold at 75 octets with a leading space. */
const foldLine = (line: string): string[] => {
  if (encoder.encode(line).length <= 75) return [line];
  const out: string[] = [];
  let current = '';
  let currentBytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (currentBytes + size > 75) {
      out.push(current);
      current = ' ';
      currentBytes = 1;
    }
    current += char;
    currentBytes += size;
  }
  out.push(current);
  return out;
};

/** `20260725T053000Z` — UTC basic format of an ISO datetime. */
const utcStamp = (iso: string | Date): string =>
  new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');

/** `20260725` — local calendar date of the event's own ISO string. */
const localDate = (iso: string): string => isoDateKey(iso).replaceAll('-', '');

/** Local date + n days, in ICS basic format. */
const localDatePlusDays = (iso: string, days: number): string => {
  const d = new Date(`${isoDateKey(iso)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10).replaceAll('-', '');
};

/**
 * Builds a single-event ICS file. `now` feeds DTSTAMP; callers control time.
 * All-day events use VALUE=DATE with the RFC's exclusive DTEND; timed events
 * are exported in UTC (startsAt carries the Belgrade offset).
 */
export const buildIcs = (event: GotovoEvent, now: Date | number = Date.now()): string => {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gotovo//Event Feed//EN',
    'BEGIN:VEVENT',
    `UID:${escapeText(event.uid)}@gotovo.app`,
    `DTSTAMP:${utcStamp(new Date(now))}`,
  ];

  if (event.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${localDate(event.startsAt)}`);
    const lastDay = event.endsAt ?? event.startsAt;
    lines.push(`DTEND;VALUE=DATE:${localDatePlusDays(lastDay, 1)}`);
  } else {
    lines.push(`DTSTART:${utcStamp(event.startsAt)}`);
    if (event.endsAt) lines.push(`DTEND:${utcStamp(event.endsAt)}`);
  }

  lines.push(`SUMMARY:${escapeText(event.title)}`);
  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
  if (event.source.url) lines.push(`URL:${event.source.url}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');

  return `${lines.flatMap(foldLine).join('\r\n')}\r\n`;
};

/** `sunrise-hike.ics` — ASCII slug of the title, uid fallback. */
export const icsFilename = (event: GotovoEvent): string => {
  const slug = event.title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || event.uid}.ics`;
};

/**
 * Google Maps search link for the event venue. The design links the location
 * value itself — no separate Map/Directions buttons.
 */
export const mapsUrl = (location: string | null, cityName: string): string => {
  const query = [location, cityName, 'Serbia'].filter(Boolean).join(', ');
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
};
