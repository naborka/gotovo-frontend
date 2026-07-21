/**
 * Zod schemas for /v1/* response bodies. These are the runtime contract:
 * every fetch goes through `.parse(body)` before the rest of the app touches
 * the data.
 *
 * Enum wire values are the lowercase slugs per BACKEND_API_CONTRACT.md
 * (Decisions 0001/0003/0005); `openapi.yaml` enum lists were corrected
 * 2026-07-21 after the Rust backend port briefly shipped Kotlin constant
 * names it had copied from the then-wrong Micronaut-generated spec.
 */

import { z } from 'zod';

// Enums — match Decision 0001 / 0003 / 0005 + Phase 0.5 backend serialization.
export const Category = z.enum([
  'HIKING',
  'SPORTS',
  'PARTY',
  'WORKSHOP',
  'EDUCATION',
  'TRIP',
  'CULTURE',
  'ENTERTAINMENT',
  'IT_NETWORKING',
]);

export const City = z.enum(['belgrade', 'novi-sad', 'subotica', 'nis', 'kragujevac']);

export const EventStatus = z.enum(['live', 'cancelled', 'postponed']);

export const Language = z.enum(['ru', 'en', 'sr', 'sr-Latn', 'sr-Cyrl']);

export const Tag = z.string().min(1).max(40);

export const Price = z.object({
  kind: z.enum(['free', 'paid', 'unknown']),
  amount: z.number().int().nullable(),
  currency: z.string().nullable(),
  display: z.string(),
});

export const SourceSummary = z.object({
  url: z.string().url().nullable(),
  count: z.number().int().min(1).max(5),
});

export const Event = z.object({
  uid: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable(),
  category: Category,
  tags: z.array(Tag),
  city: City.nullable(),
  location: z.string().nullable(),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }).nullable(),
  allDay: z.boolean(),
  timezone: z.string().min(1),
  price: Price,
  source: SourceSummary,
  language: Language,
  status: EventStatus,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const Directions = z
  .object({
    lat: z.number(),
    lng: z.number(),
    mapsUrl: z.string().url(),
  })
  .nullable();

export const Organizer = z
  .object({
    name: z.string().min(1),
    url: z.string().url().nullable(),
  })
  .nullable();

export const EventImage = z.object({
  url: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  blurhash: z.string().nullable(),
  alt: z.string().nullable(),
});

export const EventLink = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export const EventDetailExtras = z.object({
  longDescription: z.string().nullable(),
  directions: Directions,
  organizer: Organizer,
  images: z.array(EventImage),
  links: z.array(EventLink),
});

export const EventDetail = Event.extend({
  details: EventDetailExtras,
});

export const PageMeta = z.object({
  // nextCursor/total are nullable and not required by the API contract (openapi.yaml
  // PageMeta) — the backend omits them entirely. Default to null so consumers never
  // see undefined.
  nextCursor: z.string().nullable().default(null),
  hasMore: z.boolean(),
  total: z.number().int().min(0).nullable().default(null),
});

export const EventsPage = z.object({
  // The backend serializer omits empty collections, so an empty result drops
  // `data` entirely. Default to [] — an absent array and an empty array mean
  // the same thing here.
  data: z.array(Event).default([]),
  page: PageMeta,
});

const facetEntry = <T extends z.ZodTypeAny>(value: T) =>
  z.object({ value, count: z.number().int().min(0) });

export const Facets = z.object({
  categories: z.array(facetEntry(Category)),
  cities: z.array(facetEntry(City)),
  tags: z.array(facetEntry(Tag)),
  truncated: z.object({
    categories: z.boolean(),
    cities: z.boolean(),
    tags: z.boolean(),
  }),
});

export const Health = z.object({
  status: z.enum(['ok', 'degraded', 'down']),
  uptime: z.number().int().min(0),
  version: z.string().min(1),
  checkedAt: z.string().datetime(),
});

export const Problem = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().nullable().optional(),
  instance: z.string().nullable().optional(),
  requestId: z.string().nullable().optional(),
});

export type Category = z.infer<typeof Category>;
export type City = z.infer<typeof City>;
export type EventStatus = z.infer<typeof EventStatus>;
export type Language = z.infer<typeof Language>;
export type Price = z.infer<typeof Price>;
export type SourceSummary = z.infer<typeof SourceSummary>;
export type Event = z.infer<typeof Event>;
export type EventDetail = z.infer<typeof EventDetail>;
export type EventsPage = z.infer<typeof EventsPage>;
export type PageMeta = z.infer<typeof PageMeta>;
export type Facets = z.infer<typeof Facets>;
export type Health = z.infer<typeof Health>;
export type Problem = z.infer<typeof Problem>;
