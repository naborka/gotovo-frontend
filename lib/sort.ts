const cache = new Map<string, Intl.Collator>();

const collator = (locale: string): Intl.Collator => {
  let c = cache.get(locale);
  if (!c) {
    c = new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
    cache.set(locale, c);
  }
  return c;
};

/** Sort an array of strings using the locale's collation rules. */
export const sortLocale = (arr: string[], locale: string): string[] =>
  [...arr].sort(collator(locale).compare);

/** Sort an array of objects by a string key. */
export const sortLocaleBy = <T>(arr: T[], key: (item: T) => string, locale: string): T[] =>
  [...arr].sort((a, b) => collator(locale).compare(key(a), key(b)));
