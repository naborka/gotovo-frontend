import { ApiError, ContractValidationError, getEvents } from '@/lib/api/client';
import type { EventsPage } from '@/lib/api/schemas';
import { EVENTS } from '@/lib/data';
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
    limit: 30,
  };
  if (typeof sp.category === 'string') listParams.category = sp.category;
  if (typeof sp.city === 'string') listParams.city = sp.city;
  if (Array.isArray(sp.tag)) listParams.tag = sp.tag;
  else if (typeof sp.tag === 'string') listParams.tag = [sp.tag];

  const initialPage: EventsPage = await safeFetchEvents(listParams, locale);

  return <FeedClient initialPage={initialPage} locale={locale} />;
}

/**
 * Defensive fetch: when the backend is unreachable (local dev without a
 * running backend) fall back to the lib/data fixtures so the page still
 * renders. Production swaps live data once the backend is deployed.
 *
 * Throws ApiError / ContractValidationError → app/[locale]/error.tsx renders.
 */
async function safeFetchEvents(
  params: Parameters<typeof getEvents>[0],
  locale: 'ru' | 'en',
): Promise<EventsPage> {
  try {
    return await getEvents(params, {
      locale,
      next: { revalidate: 600, tags: ['events:list'] },
    });
  } catch (err) {
    // Connection refused / DNS failure → fixtures. Anything else → bubble.
    if (err instanceof ApiError || err instanceof ContractValidationError) throw err;
    return {
      data: EVENTS,
      page: { nextCursor: null, hasMore: false, total: EVENTS.length },
    };
  }
}
