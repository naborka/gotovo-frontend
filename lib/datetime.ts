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
 * "Среда, 29 апреля" (ru) / "Wednesday, 29 April" (en)
 *
 * @param iso ISO 8601 string with offset (e.g. `"2026-04-29T06:30:00+02:00"`).
 * @param locale `'ru'` or `'en'`.
 */
export const formatDateLong = (iso: string, locale: string): string =>
  getFormatter(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso));

/**
 * "29 апр." (ru) / "29 Apr" (en)
 */
export const formatDateShort = (iso: string, locale: string): string =>
  getFormatter(locale, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));

/**
 * "06:30" — 24h format, always.
 */
export const formatTime = (iso: string, locale: string): string =>
  getFormatter(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));

/**
 * `true` if both ISO strings fall on the same calendar day in `Europe/Belgrade`.
 */
export const isSameDayInBelgrade = (isoA: string, isoB: string): boolean => {
  const fmt = getFormatter('en', { year: 'numeric', month: '2-digit', day: '2-digit' });
  return fmt.format(new Date(isoA)) === fmt.format(new Date(isoB));
};
