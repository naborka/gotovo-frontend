import { getEvents } from './client';

const POPULAR_LIMIT = 50;

/**
 * Pulls the N most-recent event uids to seed generateStaticParams for the
 * detail route. Build-time only; fails open (returns []) when the backend
 * is unreachable so preview deploys without staging access still build.
 */
export async function getPopularEventUids(): Promise<string[]> {
  try {
    const page = await getEvents(
      { sort: 'recent', limit: POPULAR_LIMIT },
      { next: { revalidate: 3600 } },
    );
    return page.data.map((e) => e.uid);
  } catch (e) {
    console.warn('[generateStaticParams] could not fetch popular uids; building dynamic-only:', e);
    return [];
  }
}
