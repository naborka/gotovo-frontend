import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getEvents } from '@/lib/api/client';
import { clientEnv } from '@/lib/env';

export const revalidate = 3600;

const localePath = (locale: string, suffix: string) =>
  locale === routing.defaultLocale ? suffix : `/${locale}${suffix}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = clientEnv.NEXT_PUBLIC_SITE_URL;

  const eventsPage = await getEvents({ limit: 200 }).catch(() => ({
    data: [] as Array<{ uid: string; updatedAt: string }>,
  }));

  const home = routing.locales.map((locale) => ({
    url: `${base}${localePath(locale, '')}` || base,
    lastModified: new Date(),
    changeFrequency: 'hourly' as const,
    priority: 1,
  }));

  const events = eventsPage.data.flatMap((event) =>
    routing.locales.map((locale) => ({
      url: `${base}${localePath(locale, `/event/${event.uid}`)}`,
      lastModified: event.updatedAt ? new Date(event.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  );

  return [...home, ...events];
}
