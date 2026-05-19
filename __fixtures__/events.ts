import type { Category, City, Event } from '@/lib/api/schemas';

/**
 * Mock events in the API wire shape. Used until Phase 1 task 1.5 (#0039)
 * swaps the home page over to live data; #0042 then relocates these to
 * __fixtures__/.
 */
const ISO = (date: string, time = '10:00'): string => `${date}T${time}:00+02:00`;
const TZ = 'Europe/Belgrade';

const free: Event['price'] = { kind: 'free', amount: null, currency: null, display: 'Бесплатно' };
const paid = (amount: number, display: string): Event['price'] => ({
  kind: 'paid',
  amount: amount * 100,
  currency: 'RSD',
  display,
});

export const sampleEvents: Event[] = [
  {
    uid: 'evt_01',
    title: 'Sunrise Via Ferrata',
    description:
      'A guided climb up the rocky ridge of Fruška Gora starting at dawn. All gear provided.',
    category: 'HIKING',
    tags: ['Outdoor', 'Free', 'Weekend'],
    city: 'novi-sad',
    location: 'Fruška Gora National Park',
    startsAt: ISO('2026-04-29', '06:30'),
    endsAt: null,
    allDay: false,
    timezone: TZ,
    price: free,
    source: { url: 'https://t.me/exampleChannel/12345', count: 3 },
    language: 'ru',
    status: 'live',
    createdAt: '2026-04-28T14:20:00Z',
    updatedAt: '2026-04-28T14:20:00Z',
  },
  {
    uid: 'evt_02',
    title: 'Jazz Night at Tribute',
    description: 'Live quartet, late doors.',
    category: 'PARTY',
    tags: ['Music', 'Indoor', 'Night'],
    city: 'belgrade',
    location: 'Tribute Bar',
    startsAt: ISO('2026-04-30', '21:00'),
    endsAt: null,
    allDay: false,
    timezone: TZ,
    price: paid(800, '800 RSD'),
    source: { url: null, count: 1 },
    language: 'ru',
    status: 'live',
    createdAt: '2026-04-28T12:00:00Z',
    updatedAt: '2026-04-28T12:00:00Z',
  },
  {
    uid: 'evt_03',
    title: 'Pottery Workshop',
    description: null,
    category: 'WORKSHOP',
    tags: ['Indoor', 'Art'],
    city: 'novi-sad',
    location: null,
    startsAt: ISO('2026-05-01', '14:00'),
    endsAt: null,
    allDay: false,
    timezone: TZ,
    price: paid(1500, '1500 RSD'),
    source: { url: null, count: 2 },
    language: 'ru',
    status: 'live',
    createdAt: '2026-04-28T11:00:00Z',
    updatedAt: '2026-04-28T11:00:00Z',
  },
  {
    uid: 'evt_04',
    title: 'Open Air Cinema',
    description: 'Free screening, classic 60s noir.',
    category: 'CULTURE',
    tags: ['Outdoor', 'Free', 'Family'],
    city: 'belgrade',
    location: 'Kalemegdan',
    startsAt: ISO('2026-05-02', '20:00'),
    endsAt: null,
    allDay: false,
    timezone: TZ,
    price: free,
    source: { url: null, count: 1 },
    language: 'ru',
    status: 'live',
    createdAt: '2026-04-28T09:30:00Z',
    updatedAt: '2026-04-28T09:30:00Z',
  },
  {
    uid: 'evt_05',
    title: 'Design Week — Opening',
    description: null,
    category: 'CULTURE',
    tags: ['Design', 'Exhibition', 'Multi-day'],
    city: 'novi-sad',
    location: 'Cultural Centre',
    startsAt: ISO('2026-05-03', '18:00'),
    endsAt: ISO('2026-05-09', '23:00'),
    allDay: false,
    timezone: TZ,
    price: free,
    source: { url: null, count: 3 },
    language: 'ru',
    status: 'live',
    createdAt: '2026-04-28T08:00:00Z',
    updatedAt: '2026-04-28T08:00:00Z',
  },
];

export const sampleCategories: Category[] = [
  ...new Set(sampleEvents.map((e) => e.category)),
].sort() as Category[];

export const sampleCities: City[] = [
  ...new Set(sampleEvents.map((e) => e.city).filter((c): c is City => c != null)),
].sort() as City[];

export const sampleTags: string[] = [...new Set(sampleEvents.flatMap((e) => e.tags))].sort();
