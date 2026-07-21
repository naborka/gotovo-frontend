import { getEvents } from '@/lib/api/client';
import type { EventsPage } from '@/lib/api/schemas';
import { tagEventList, tagFacets } from '@/lib/api/tags';
import { EVENTS_PAGE_LIMIT } from '@/lib/filters';
import { FeedClient } from './_components/FeedClient';

type SearchParams = Record<string, string | string[] | undefined>;
type Props = {
  params: Promise<{ locale: 'ru' | 'en' }>;
  searchParams: Promise<SearchParams>;
};

/**
 * Normalizes a multi-value query param to an array. nuqs serializes arrays as
 * one comma-separated value (`category=HIKING,PARTY`), while direct links may
 * repeat the key — accept both.
 */
const asArray = (value: string | string[] | undefined): string[] => {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  return raw.flatMap((v) => v.split(',')).filter(Boolean);
};

/**
 * Home page — Server Component. Fetches the event feed and hands it off
 * to the FeedClient island for interactivity. Filters live in the URL;
 * each change re-renders this RSC.
 */
export default async function HomePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;

  const listParams: Parameters<typeof getEvents>[0] = {
    tagMode: sp.tagMode === 'all' ? 'all' : 'any',
    sort: sp.sort === 'recent' ? 'recent' : 'timeline',
    limit: EVENTS_PAGE_LIMIT,
  };
  const categories = asArray(sp.category);
  if (categories.length > 0) listParams.category = categories;
  if (typeof sp.city === 'string') listParams.city = sp.city;
  const tags = asArray(sp.tag);
  if (tags.length > 0) listParams.tag = tags;

  const initialPage: EventsPage = await getEvents(listParams, {
    locale,
    next: { revalidate: 600, tags: [tagEventList(), tagFacets()] },
  });

  return <FeedClient initialPage={initialPage} locale={locale} />;
}
