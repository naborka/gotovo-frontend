/**
 * Pure URL matchers for the service worker's runtime caching routes
 * (app/sw.ts). Kept out of the worker file so they are unit-testable —
 * the worker itself only runs in a ServiceWorkerGlobalScope.
 */

/** `GET /v1/events` (the cursor-paginated list), any query string. */
export const isEventsListRequest = (url: URL): boolean => /^\/v1\/events\/?$/.test(url.pathname);

/** `GET /v1/events/{uid}` (event detail). */
export const isEventDetailRequest = (url: URL): boolean =>
  /^\/v1\/events\/[^/]+$/.test(url.pathname);
