const TZ = 'Europe/Belgrade';

const formatterCache = new Map<string, Intl.DateTimeFormat>();

const getFormatter = (locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = formatterCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { ...options, timeZone: TZ });
    formatterCache.set(key, f);
  }
  return f;
};

/**
 * "06:30" — 24h format, always.
 *
 * @param iso ISO 8601 string with offset (e.g. `"2026-04-29T06:30:00+02:00"`).
 * @param locale `'ru'` or `'en'`.
 */
export const formatTime = (iso: string, locale: string): string =>
  getFormatter(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));

/** Plain `en` resolves to en-US ("July 20"); the design uses day-first order. */
const dayFirstLocale = (locale: string): string => (locale === 'en' ? 'en-GB' : locale);

/**
 * "20 July" — day + full month, no weekday.
 */
export const formatDayMonth = (iso: string, locale: string): string =>
  getFormatter(dayFirstLocale(locale), {
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso));

/**
 * "Saturday" — full weekday name.
 */
export const formatWeekdayLong = (iso: string, locale: string): string =>
  getFormatter(locale, { weekday: 'long' }).format(new Date(iso));

/**
 * "Mon 20 July" — abbreviated weekday + day + full month.
 */
export const formatWeekdayDayMonth = (iso: string, locale: string): string =>
  getFormatter(dayFirstLocale(locale), {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso));

/**
 * YYYY-MM-DD calendar date in `Europe/Belgrade`.
 * en-CA renders dates as ISO `YYYY-MM-DD`.
 */
export const belgradeDateKey = (input: string | Date | number): string =>
  getFormatter('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    typeof input === 'string' ? new Date(input) : input,
  );

const dayKeyToUtcNoon = (key: string): number => new Date(`${key}T12:00:00Z`).getTime();

/** Position of `iso`'s Belgrade calendar day relative to `now`'s. */
export type RelativeDayKind = 'today' | 'tomorrow' | 'other';

/**
 * Classifies an ISO datetime (or bare `YYYY-MM-DD` group key) against `now`
 * on the Europe/Belgrade calendar. Pure: callers control time.
 */
export const relativeDayKind = (iso: string, now: Date | number = Date.now()): RelativeDayKind => {
  const dayKey = belgradeDateKey(iso);
  const todayKey = belgradeDateKey(now);
  // Compare via UTC-noon timestamps: immune to DST-length days.
  const diff = Math.round((dayKeyToUtcNoon(dayKey) - dayKeyToUtcNoon(todayKey)) / 86_400_000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return 'other';
};

/**
 * `true` when `iso` falls on Saturday or Sunday in `Europe/Belgrade`.
 */
export const isWeekendInBelgrade = (iso: string): boolean => {
  const weekday = getFormatter('en', { weekday: 'short' }).format(new Date(iso));
  return weekday === 'Sat' || weekday === 'Sun';
};

/**
 * Heading word for a date group or detail view: localized "Today"/"Tomorrow"
 * via `translate`, otherwise the full weekday name.
 */
export const relativeDayHeading = (
  iso: string,
  locale: string,
  translate: (kind: 'today' | 'tomorrow') => string,
): string => {
  const kind = relativeDayKind(iso);
  return kind === 'other' ? formatWeekdayLong(iso, locale) : translate(kind);
};
