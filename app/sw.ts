/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from '@serwist/turbopack/worker';
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  type PrecacheEntry,
  Serwist,
  type SerwistGlobalConfig,
  StaleWhileRevalidate,
} from 'serwist';
import { isEventDetailRequest, isEventsListRequest } from '@/lib/sw-matchers';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const FIVE_MIN = 5 * 60;
const ONE_HOUR = 60 * 60;
const ONE_DAY = 24 * 60 * 60;
const SEVEN_DAYS = 7 * ONE_DAY;

const appRuntimeCaching = [
  // API responses arrive via cors-mode fetch, so an opaque response (status 0)
  // can never legitimately occur here — only 200 is cacheable.
  {
    matcher: ({ url }: { url: URL }) => isEventsListRequest(url),
    handler: new StaleWhileRevalidate({
      cacheName: 'api-events-list',
      plugins: [
        new CacheableResponsePlugin({ statuses: [200] }),
        new ExpirationPlugin({ maxAgeSeconds: FIVE_MIN, maxEntries: 32 }),
      ],
    }),
  },
  {
    matcher: ({ url }: { url: URL }) => isEventDetailRequest(url),
    handler: new StaleWhileRevalidate({
      cacheName: 'api-events-detail',
      plugins: [
        new CacheableResponsePlugin({ statuses: [200] }),
        new ExpirationPlugin({ maxAgeSeconds: ONE_HOUR, maxEntries: 64 }),
      ],
    }),
  },
  {
    matcher: ({ url }: { url: URL }) => url.pathname.startsWith('/_next/image'),
    handler: new CacheFirst({
      cacheName: 'next-image',
      plugins: [
        new CacheableResponsePlugin({ statuses: [200] }),
        new ExpirationPlugin({ maxAgeSeconds: SEVEN_DAYS, maxEntries: 128 }),
      ],
    }),
  },
  {
    matcher: ({ request }: { request: Request }) => request.destination === 'document',
    handler: new NetworkFirst({
      cacheName: 'pages',
      networkTimeoutSeconds: 3,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxAgeSeconds: ONE_DAY, maxEntries: 32 }),
      ],
    }),
  },
];

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST ?? [],
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [...appRuntimeCaching, ...defaultCache],
  fallbacks: {
    entries: [
      {
        url: '/en/offline',
        matcher: ({ request }) =>
          request.destination === 'document' && new URL(request.url).pathname.startsWith('/en'),
      },
      {
        url: '/offline',
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
});

serwist.addEventListeners();
