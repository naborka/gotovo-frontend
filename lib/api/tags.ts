/**
 * Cache-tag builders. Strings here MUST match the tags the backend
 * RevalidateNotifier emits (backend issue #0033) and the frontend
 * /api/revalidate webhook consumes (frontend issue #0041).
 */

export const tagEventList = (): string => 'events:list';
export const tagFacets = (): string => 'facets';
export const tagEventDetail = (uid: string): string => `events:detail:${uid}`;

export const TAG_EVENT_LIST = 'events:list' as const;
export const TAG_FACETS = 'facets' as const;
