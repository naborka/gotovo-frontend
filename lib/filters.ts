import type { Category, City } from '@/lib/api/schemas';

/** Sentinel for "no filter active" in the client filter logic. */
export const ALL_FILTER = 'all';

/** Events fetched per page — shared by the RSC seed fetch and cursor pagination. */
export const EVENTS_PAGE_LIMIT = 30;

/** All v1 backend categories (Decision 0001). */
export const ALL_CATEGORIES: readonly Category[] = [
  'HIKING',
  'SPORTS',
  'PARTY',
  'WORKSHOP',
  'EDUCATION',
  'TRIP',
  'CULTURE',
  'ENTERTAINMENT',
  'IT_NETWORKING',
] as const;

/** All v1 city slugs (Decision 0003). */
export const ALL_CITIES: readonly City[] = [
  'belgrade',
  'novi-sad',
  'subotica',
  'nis',
  'kragujevac',
] as const;
