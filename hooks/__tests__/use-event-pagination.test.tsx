import { act, renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEventPagination } from '@/hooks/use-event-pagination';
import type { Event, EventsPage } from '@/lib/api/schemas';

const BASE = 'https://api.gotovo.app/v1';
const server = setupServer();

let ioCallbacks: ((entries: { isIntersecting: boolean }[]) => void)[] = [];

class MockIntersectionObserver {
  private readonly cb: (entries: { isIntersecting: boolean }[]) => void;
  constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
    this.cb = cb;
    ioCallbacks.push(cb);
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {
    ioCallbacks = ioCallbacks.filter((c) => c !== this.cb);
  }
}

type HookResult = { current: ReturnType<typeof useEventPagination> };

/** Attach the callback ref to a node so the hook wires up its observer. */
const attach = (result: HookResult) => {
  act(() => result.current.sentinelRef(document.createElement('div')));
};

const intersect = async () => {
  await act(async () => {
    for (const cb of ioCallbacks) cb([{ isIntersecting: true }]);
  });
};

const makeEvent = (uid: string): Event => ({
  uid,
  title: `Event ${uid}`,
  description: null,
  category: 'HIKING',
  tags: [],
  city: 'novi-sad',
  location: null,
  startsAt: '2026-06-01T10:00:00+02:00',
  endsAt: null,
  allDay: false,
  timezone: 'Europe/Belgrade',
  price: { kind: 'free', amount: null, currency: null, display: 'Free' },
  source: { url: null, count: 1 },
  language: 'ru',
  status: 'live',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
});

const makePage = (uids: string[], nextCursor: string | null): EventsPage => ({
  data: uids.map(makeEvent),
  page: { nextCursor, hasMore: nextCursor != null, total: null },
});

const baseParams = { tagMode: 'any' as const, sort: 'timeline' as const, limit: 30 };
const render = (initialPage: EventsPage) =>
  renderHook(
    ({ page }) => useEventPagination({ initialPage: page, params: baseParams, locale: 'ru' }),
    { initialProps: { page: initialPage } },
  );

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  server.listen({ onUnhandledRequest: 'error' });
});
beforeEach(() => {
  ioCallbacks = [];
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
});

describe('useEventPagination', () => {
  it('seeds events from the initial page without fetching', () => {
    const { result } = render(makePage(['a', 'b'], null));
    expect(result.current.events.map((e) => e.uid)).toEqual(['a', 'b']);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('appends the next page when the sentinel intersects', async () => {
    server.use(http.get(`${BASE}/events`, () => HttpResponse.json(makePage(['c', 'd'], null))));
    const { result } = render(makePage(['a', 'b'], 'cur-1'));
    attach(result);
    await intersect();
    await waitFor(() => expect(result.current.events).toHaveLength(4));
    expect(result.current.events.map((e) => e.uid)).toEqual(['a', 'b', 'c', 'd']);
    expect(result.current.hasMore).toBe(false);
  });

  it('stops fetching once a page reports hasMore false', async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/events`, () => {
        calls += 1;
        return HttpResponse.json(makePage(['c'], null));
      }),
    );
    const { result } = render(makePage(['a'], 'cur-1'));
    attach(result);
    await intersect();
    await waitFor(() => expect(result.current.events).toHaveLength(2));
    await intersect();
    await intersect();
    expect(calls).toBe(1);
  });

  it('dedups events that repeat across pages by uid', async () => {
    server.use(http.get(`${BASE}/events`, () => HttpResponse.json(makePage(['b', 'c'], null))));
    const { result } = render(makePage(['a', 'b'], 'cur-1'));
    attach(result);
    await intersect();
    await waitFor(() => expect(result.current.events).toHaveLength(3));
    expect(result.current.events.map((e) => e.uid)).toEqual(['a', 'b', 'c']);
  });

  it('resets accumulation when the initial page changes (filter nav)', async () => {
    server.use(http.get(`${BASE}/events`, () => HttpResponse.json(makePage(['c'], null))));
    const { result, rerender } = render(makePage(['a'], 'cur-1'));
    attach(result);
    await intersect();
    await waitFor(() => expect(result.current.events).toHaveLength(2));

    act(() => rerender({ page: makePage(['x', 'y'], null) }));
    expect(result.current.events.map((e) => e.uid)).toEqual(['x', 'y']);
    expect(result.current.hasMore).toBe(false);
  });

  it('surfaces an error and does not auto-hammer the failing endpoint', async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/events`, () => {
        calls += 1;
        return HttpResponse.json({ title: 'boom' }, { status: 500 });
      }),
    );
    const { result } = render(makePage(['a'], 'cur-1'));
    attach(result);
    await intersect();
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.events).toHaveLength(1);
    await intersect();
    expect(calls).toBe(1);
  });

  it('recovers on retry after an error', async () => {
    server.use(
      http.get(`${BASE}/events`, () => HttpResponse.json({ title: 'boom' }, { status: 500 })),
    );
    const { result } = render(makePage(['a'], 'cur-1'));
    attach(result);
    await intersect();
    await waitFor(() => expect(result.current.error).not.toBeNull());

    server.use(http.get(`${BASE}/events`, () => HttpResponse.json(makePage(['c'], null))));
    await act(async () => {
      result.current.retry();
    });
    await waitFor(() => expect(result.current.events).toHaveLength(2));
    expect(result.current.error).toBeNull();
  });
});
