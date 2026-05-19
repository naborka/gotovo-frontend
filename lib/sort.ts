import { useMemo } from 'react';

/**
 * Locale-aware string sort using Intl.Collator.
 * Use this instead of `.sort()` when sorting user-visible strings.
 */
export function sortLocale(strings: string[], locale: string): string[] {
  const collator = new Intl.Collator(locale);
  return [...strings].sort(collator.compare);
}

/**
 * React hook wrapper for sortLocale — memoizes the collator.
 */
export function useSortLocale(locale: string): (strings: string[]) => string[] {
  return useMemo(() => {
    const collator = new Intl.Collator(locale);
    return (strings: string[]) => [...strings].sort(collator.compare);
  }, [locale]);
}
