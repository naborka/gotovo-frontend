/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from '@serwist/turbopack/worker';
import { type PrecacheEntry, Serwist, type SerwistGlobalConfig } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const DEFAULT_OFFLINE = '/offline';
const OFFLINE_BY_LOCALE: Record<string, string> = {
  en: '/en/offline',
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST ?? [],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: DEFAULT_OFFLINE,
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
});

self.addEventListener('fetch', (event) => {
  if (event.request.destination !== 'document') return;
  const url = new URL(event.request.url);
  const localeMatch = url.pathname.match(/^\/(en)(?:\/|$)/);
  if (!localeMatch) return;
  const offlineUrl = OFFLINE_BY_LOCALE[localeMatch[1] ?? 'ru'] ?? DEFAULT_OFFLINE;
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cache = await caches.match(offlineUrl);
      return cache ?? (await caches.match(DEFAULT_OFFLINE)) ?? Response.error();
    }),
  );
});

serwist.addEventListeners();
