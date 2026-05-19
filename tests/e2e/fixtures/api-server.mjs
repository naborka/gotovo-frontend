import { createServer } from 'node:http';

const ISO = (date, time = '10:00') => `${date}T${time}:00+02:00`;

const events = [
  {
    uid: 'evt-mock-01',
    title: 'Mock Hike at Fruška Gora',
    description: 'Test event #1 (HIKING).',
    category: 'HIKING',
    tags: ['Outdoor', 'Weekend'],
    city: 'novi-sad',
    location: 'Fruška Gora',
    startsAt: ISO('2026-06-01', '07:00'),
    endsAt: null,
    allDay: false,
    timezone: 'Europe/Belgrade',
    price: { kind: 'free', amount: null, currency: null, display: 'Free' },
    source: { url: 'https://example.com/1', count: 1 },
    language: 'ru',
    status: 'live',
    createdAt: '2026-05-19T10:00:00Z',
    updatedAt: '2026-05-19T10:00:00Z',
  },
  {
    uid: 'evt-mock-02',
    title: 'Mock Jazz Night',
    description: 'Test event #2 (PARTY).',
    category: 'PARTY',
    tags: ['Music', 'Night'],
    city: 'belgrade',
    location: 'Tribute',
    startsAt: ISO('2026-06-02', '21:00'),
    endsAt: null,
    allDay: false,
    timezone: 'Europe/Belgrade',
    price: { kind: 'free', amount: null, currency: null, display: 'Free' },
    source: { url: 'https://example.com/2', count: 2 },
    language: 'ru',
    status: 'live',
    createdAt: '2026-05-19T10:00:00Z',
    updatedAt: '2026-05-19T10:00:00Z',
  },
  {
    uid: 'evt-mock-03',
    title: 'Mock Workshop',
    description: 'Test event #3 (WORKSHOP).',
    category: 'WORKSHOP',
    tags: ['Indoor', 'Weekend'],
    city: 'novi-sad',
    location: 'Studio',
    startsAt: ISO('2026-06-03', '14:00'),
    endsAt: null,
    allDay: false,
    timezone: 'Europe/Belgrade',
    price: { kind: 'free', amount: null, currency: null, display: 'Free' },
    source: { url: 'https://example.com/3', count: 1 },
    language: 'ru',
    status: 'live',
    createdAt: '2026-05-19T10:00:00Z',
    updatedAt: '2026-05-19T10:00:00Z',
  },
];

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');

  if (url.pathname === '/v1/health') {
    return json(res, 200, { status: 'ok' });
  }

  if (url.pathname === '/v1/events') {
    const category = url.searchParams.get('category');
    const city = url.searchParams.get('city');
    let items = events;
    if (category) items = items.filter((e) => e.category === category);
    if (city) items = items.filter((e) => e.city === city);
    return json(res, 200, {
      data: items,
      page: { nextCursor: null, hasMore: false, total: items.length },
    });
  }

  const detailMatch = url.pathname.match(/^\/v1\/events\/([^/]+)$/);
  if (detailMatch) {
    const event = events.find((e) => e.uid === detailMatch[1]);
    if (!event) {
      return json(res, 404, { type: 'about:blank', title: 'not found', status: 404 });
    }
    return json(res, 200, {
      ...event,
      details: {
        longDescription: null,
        directions: null,
        organizer: null,
        images: [],
        links: [],
      },
    });
  }

  if (url.pathname === '/v1/facets') {
    return json(res, 200, {
      categories: [...new Set(events.map((e) => e.category))].map((c) => ({ value: c, count: 1 })),
      cities: [...new Set(events.map((e) => e.city).filter(Boolean))].map((c) => ({
        value: c,
        count: 1,
      })),
      tags: [...new Set(events.flatMap((e) => e.tags))].map((t) => ({ value: t, count: 1 })),
    });
  }

  json(res, 404, { type: 'about:blank', title: 'not found', status: 404 });
});

const port = Number(process.env.MOCK_API_PORT ?? 4000);
server.listen(port, () => {
  process.stdout.write(`Mock API listening on http://localhost:${port}\n`);
});
