import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  ApiError,
  ContractValidationError,
  getEvent,
  getEvents,
  getFacets,
  getHealth,
} from '@/lib/api/client';
import eventFixture from './fixtures/event.json';
import eventDetailFixture from './fixtures/event-detail.json';
import facetsFixture from './fixtures/facets.json';
import healthFixture from './fixtures/health.json';

const BASE = 'https://api.gotovo.app/v1';

const server = setupServer();

beforeAll(() => {
  process.env.NEXT_PUBLIC_API_BASE_URL = BASE;
  process.env.NEXT_PUBLIC_SEARCH_ENABLED = 'false';
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('getEvents', () => {
  it('returns a parsed page on 200', async () => {
    server.use(
      http.get(`${BASE}/events`, () =>
        HttpResponse.json({
          data: [eventFixture],
          page: { nextCursor: null, hasMore: false, total: 1 },
        }),
      ),
    );
    const page = await getEvents({});
    expect(page.data).toHaveLength(1);
    expect(page.page.hasMore).toBe(false);
  });

  it('serialises filters into querystring', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/events`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          data: [],
          page: { nextCursor: null, hasMore: false, total: 0 },
        });
      }),
    );
    await getEvents({ category: 'HIKING', tag: ['Outdoor', 'Free'], tagMode: 'all' });
    expect(capturedUrl).toContain('category=HIKING');
    expect(capturedUrl).toContain('tag=Outdoor');
    expect(capturedUrl).toContain('tag=Free');
    expect(capturedUrl).toContain('tagMode=all');
  });

  it('accepts a page that omits optional nextCursor/total', async () => {
    server.use(
      http.get(`${BASE}/events`, () => HttpResponse.json({ data: [], page: { hasMore: false } })),
    );
    const page = await getEvents({ city: 'novi-sad', tagMode: 'any' });
    expect(page.page.hasMore).toBe(false);
    expect(page.page.nextCursor).toBeNull();
    expect(page.page.total).toBeNull();
  });

  it('throws ApiError with parsed Problem on 4xx', async () => {
    server.use(
      http.get(`${BASE}/events`, () =>
        HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Malformed cursor',
            status: 400,
            instance: '/v1/events',
            requestId: 'r-1',
          },
          { status: 400 },
        ),
      ),
    );
    await expect(getEvents({})).rejects.toBeInstanceOf(ApiError);
    await expect(getEvents({})).rejects.toMatchObject({ status: 400 });
  });

  it('throws ContractValidationError on body-shape mismatch', async () => {
    server.use(http.get(`${BASE}/events`, () => HttpResponse.json({ wrong: true })));
    await expect(getEvents({})).rejects.toBeInstanceOf(ContractValidationError);
  });

  it('sends Accept-Language from locale option', async () => {
    let lang = '';
    server.use(
      http.get(`${BASE}/events`, ({ request }) => {
        lang = request.headers.get('accept-language') ?? '';
        return HttpResponse.json({
          data: [],
          page: { nextCursor: null, hasMore: false, total: 0 },
        });
      }),
    );
    await getEvents({}, { locale: 'en' });
    expect(lang).toBe('en');
  });

  it('echoes provided X-Request-ID', async () => {
    let rid = '';
    server.use(
      http.get(`${BASE}/events`, ({ request }) => {
        rid = request.headers.get('x-request-id') ?? '';
        return HttpResponse.json({
          data: [],
          page: { nextCursor: null, hasMore: false, total: 0 },
        });
      }),
    );
    await getEvents({}, { requestId: 'rid-test-123' });
    expect(rid).toBe('rid-test-123');
  });
});

describe('getEvent', () => {
  it('returns parsed detail on 200', async () => {
    server.use(http.get(`${BASE}/events/evt_01`, () => HttpResponse.json(eventDetailFixture)));
    const ev = await getEvent('evt_01');
    expect(ev.details.images).toHaveLength(0);
  });

  it('throws ApiError with status 404', async () => {
    server.use(
      http.get(`${BASE}/events/evt_404`, () =>
        HttpResponse.json(
          { type: 'about:blank', title: 'Not Found', status: 404 },
          { status: 404 },
        ),
      ),
    );
    const err = await getEvent('evt_404').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(404);
  });

  it('returns parsed body on 410 cancelled (contract §3)', async () => {
    server.use(
      http.get(`${BASE}/events/evt_gone`, () =>
        HttpResponse.json({ ...eventDetailFixture, status: 'cancelled' }, { status: 410 }),
      ),
    );
    const ev = await getEvent('evt_gone');
    expect(ev.status).toBe('cancelled');
  });

  it('url-encodes the uid', async () => {
    let capturedUrl = '';
    server.use(
      http.get(`${BASE}/events/:uid`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(eventDetailFixture);
      }),
    );
    await getEvent('evt with spaces');
    expect(capturedUrl).toContain('evt%20with%20spaces');
  });
});

describe('getFacets', () => {
  it('returns parsed facets on 200', async () => {
    server.use(http.get(`${BASE}/facets`, () => HttpResponse.json(facetsFixture)));
    const facets = await getFacets({});
    expect(facets.categories[0]?.value).toBe('HIKING');
  });
});

describe('getHealth', () => {
  it('returns parsed health on 200', async () => {
    server.use(http.get(`${BASE}/health`, () => HttpResponse.json(healthFixture)));
    const h = await getHealth();
    expect(h.status).toBe('ok');
  });
});
