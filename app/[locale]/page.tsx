import { getEvents } from '@/lib/api/client';
import type { EventsPage } from '@/lib/api/schemas';
import { tagEventList, tagFacets } from '@/lib/api/tags';
import { EVENTS_PAGE_LIMIT } from '@/lib/filters';
import { sortLocale } from '@/lib/sort';
import { FeedClient } from './_components/FeedClient';

type SearchParams = Record<string, string | string[] | undefined>;
type Props = {
  params: Promise<{ locale: 'ru' | 'en' }>;
  searchParams: Promise<SearchParams>;
};

/**
 * Home page — Server Component. Fetches the event feed and hands it off
 * to the FeedClient island for interactivity.
 *
 * Filter state lives in the client island today; Phase 2 (#0043) moves it
 * into the URL so each filter change re-renders this RSC.
 */
export default async function HomePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;

  const listParams: Parameters<typeof getEvents>[0] = {
    tagMode: sp.tagMode === 'all' ? 'all' : 'any',
    sort: sp.sort === 'recent' ? 'recent' : 'timeline',
    limit: EVENTS_PAGE_LIMIT,
  };
  if (typeof sp.category === 'string') listParams.category = sp.category;
  if (typeof sp.city === 'string') listParams.city = sp.city;
  if (Array.isArray(sp.tag)) listParams.tag = sp.tag;
  else if (typeof sp.tag === 'string') listParams.tag = [sp.tag];

  const initialPage: EventsPage = await getEvents(listParams, {
    locale,
    next: { revalidate: 600, tags: [tagEventList(), tagFacets()] },
  });
  const availableTags = sortLocale([...new Set(initialPage.data.flatMap((e) => e.tags))], locale);

  return <FeedClient initialPage={initialPage} locale={locale} availableTags={availableTags} />;
}
