import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getEvent, getEvents } from '@/lib/api/client';
import { tagEventDetail, tagEventList, tagFacets } from '@/lib/api/tags';

const BASE = 'https://api.gotovo.app/v1';

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_BASE_URL = BASE;
  process.env.NEXT_PUBLIC_SEARCH_ENABLED = 'false';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('tag helpers', () => {
  it('produce stable strings matching the backend notifier (see backend #0033)', () => {
    expect(tagEventList()).toBe('events:list');
    expect(tagFacets()).toBe('facets');
    expect(tagEventDetail('uid-1')).toBe('events:detail:uid-1');
  });
});

describe('getEvents forwards Next.js cache options', () => {
  it('passes next.revalidate + next.tags to fetch', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: [], page: { nextCursor: null, hasMore: false, total: 0 } }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );

    await getEvents({}, { next: { revalidate: 600, tags: [tagEventList(), tagFacets()] } });

    const call = fetchSpy.mock.calls[0]?.[1] as RequestInit & {
      next?: { revalidate?: number; tags?: string[] };
    };
    expect(call.next).toEqual({ revalidate: 600, tags: ['events:list', 'facets'] });
  });
});

describe('getEvent forwards Next.js cache options', () => {
  it('passes next.tags with per-uid detail tag', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          uid: 'evt_01',
          title: 'Test',
          description: null,
          category: 'HIKING',
          tags: [],
          city: null,
          location: null,
          startsAt: '2026-05-01T10:00:00+02:00',
          endsAt: null,
          allDay: false,
          timezone: 'Europe/Belgrade',
          price: { kind: 'free', amount: null, currency: null, display: 'F' },
          source: { url: null, count: 1 },
          language: 'ru',
          status: 'live',
          createdAt: '2026-04-30T00:00:00Z',
          updatedAt: '2026-04-30T00:00:00Z',
          details: {
            longDescription: null,
            directions: null,
            organizer: null,
            images: [],
            links: [],
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    await getEvent('evt_01', {
      next: { revalidate: 600, tags: [tagEventDetail('evt_01')] },
    });

    const call = fetchSpy.mock.calls[0]?.[1] as RequestInit & {
      next?: { revalidate?: number; tags?: string[] };
    };
    expect(call.next?.tags).toEqual(['events:detail:evt_01']);
  });
});
