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
  {
    matcher: ({ url }: { url: URL }) =>
      /\/v1\/events\/?(\?|$)/.test(url.pathname + url.search) &&
      !/\/v1\/events\/[^/?]+/.test(url.pathname),
    handler: new StaleWhileRevalidate({
      cacheName: 'api-events-list',
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxAgeSeconds: FIVE_MIN, maxEntries: 32 }),
      ],
    }),
  },
  {
    matcher: ({ url }: { url: URL }) => /\/v1\/events\/[^/?]+/.test(url.pathname),
    handler: new StaleWhileRevalidate({
      cacheName: 'api-events-detail',
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxAgeSeconds: ONE_HOUR, maxEntries: 64 }),
      ],
    }),
  },
  {
    matcher: ({ url }: { url: URL }) => /\/v1\/(cities|categories|tags)\/?$/.test(url.pathname),
    handler: new CacheFirst({
      cacheName: 'api-reference',
      plugins: [
        new CacheableResponsePlugin({ statuses: [200] }),
        new ExpirationPlugin({ maxAgeSeconds: ONE_DAY, maxEntries: 8 }),
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

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST ?? [],
  skipWaiting: true,
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
