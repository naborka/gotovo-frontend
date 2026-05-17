# Gotovo — Backend API Contract (v1.1)

> Authoritative contract between the **Next.js frontend** (Vercel) and the **existing backend**. Every endpoint listed here is derived from a concrete need in the frontend — nothing speculative. Anything not listed is out of scope for v1.

---

## Changelog from v1.0

This document was reviewed and refined. Material changes:

| # | Change | Why |
| --- | --- | --- |
| 1 | Cache-Control moved from a global default to **per-endpoint policy** (§1) | v1.0 mandated `s-maxage=600` for every endpoint then claimed 1 h caches for some — internally inconsistent |
| 2 | `/v1/facets` now **facet-aware**: counts in each dimension exclude that dimension's filter | v1.0 made non-active chips read "(0)" once a filter was picked — UI dead-end |
| 3 | `endsAt` inclusivity **decided**, not deferred (it is inclusive of the last calendar day) | Defer-by-question = a v2 bug |
| 4 | `q` search parameter: explicit `501 Not Implemented` with `Sunset`/`Deprecation` headers when unsupported, never silently empty | Silent empty responses are undebuggable |
| 5 | `prevCursor` removed; backwards navigation is the browser's job | Cursor pagination doesn't reverse efficiently |
| 6 | `POST /revalidate` requires **HMAC-SHA256 signature** + timestamp (replay protection) | Bearer alone has no replay defense |
| 7 | Hard caps added: date range ≤ 92 days, `paths`/`tags` ≤ 100 per revalidate call | DoS surface |
| 8 | `X-Request-ID` required on every request/response (tracing) | Prod debugging needed it |
| 9 | Rate limits **explicitly per layer** (edge vs origin) | Was ambiguous |
| 10 | NFRs split into **edge SLO** and **origin SLO** | Couldn't tell which side owned which target |
| 11 | Versioning policy: explicit list of what counts as breaking vs additive (§0) | "Never break /v1" was undefined |
| 12 | `Retry-After` recommended values added for 429 and 503 | Vague |
| 13 | Tag semantics: OR by default; opt-in AND via `tagMode=all` | Frontend currently does OR; AND is a real use case |
| 14 | `source.count` semantics defined: number of *distinct upstream sources* that confirmed this event | Was undefined |
| 15 | HEAD explicitly supported on all GETs | Required for cheap ETag probes |
| 16 | CORS preflight, `If-Modified-Since`, `sr-Latn`/`sr-Cyrl` covered | Polish |
| 17 | Open Questions #1 and #2 (city identity, tag governance) **promoted to blocking pre-signature items** | They ARE the contract |

---

## 0. Conventions (apply to every endpoint)

### Transport

- **Base URL**: `https://api.gotovo.app/v1` (placeholder — backend confirms)
- **Protocol**: HTTPS only. HTTP returns `426 Upgrade Required`.
- **Versioning**: URL-based (`/v1/...`). Breaking changes → `/v2`. `/v1` is **never broken in place**.

### Versioning policy — what counts as breaking

| Change type | Counts as | Allowed in `/v1`? |
| --- | --- | --- |
| Adding an optional field to a response | Additive | ✅ Yes |
| Adding a new endpoint | Additive | ✅ Yes |
| Adding a new optional query parameter | Additive | ✅ Yes |
| Adding a value to an enum (only with `Sunset` notice ≥ 90 days) | Additive but coordinate | ⚠️ Coordinated |
| Removing a field | **Breaking** | ❌ Requires `/v2` |
| Narrowing a type (e.g. `string` → `enum`) | **Breaking** | ❌ Requires `/v2` |
| Changing a field's semantics (same name, different meaning) | **Breaking** | ❌ Requires `/v2` |
| Making a previously-optional field required | **Breaking** | ❌ Requires `/v2` |
| Removing an enum value | **Breaking** | ❌ Requires `/v2` |
| Changing default values of query parameters | **Breaking** | ❌ Requires `/v2` |

### Encoding

- **Request & response**: `application/json; charset=utf-8`.
- **Dates**: **ISO 8601 strings**.
  - **`startsAt` / `endsAt`**: with offset, e.g. `"2026-04-29T06:30:00+02:00"`. Local civil time of the event.
  - **`createdAt` / `updatedAt`**: UTC, with `Z`, e.g. `"2026-04-28T14:20:00Z"`. Server clock.
  - **Calendar dates** (`from`, `to` query params): `"YYYY-MM-DD"`.
- **IDs**: opaque strings. Frontend treats as black boxes; never parses.
- **Booleans**: real JSON booleans, never `"true"` / `0` / `1`.
- **Money**: structured object (see §3 — Event schema). Never a free-text "price" string.

### Tracing headers (required on every request and response)

- **Request → Server**: client SHOULD send `X-Request-ID: <uuid v4>`. If absent, server generates one.
- **Server → Client**: server MUST echo `X-Request-ID` on every response (including errors). This is the single anchor for cross-system debugging.

### Auth

- v1 public endpoints (`GET /v1/...`) require **no auth header**.
- Server-to-server endpoints (revalidation webhook) use **HMAC-SHA256 over `timestamp.body`** plus a shared secret. See §6.

### Errors — RFC 7807 problem+json

Every non-2xx response uses this shape, with `Content-Type: application/problem+json`:

```json
{
  "type":      "https://api.gotovo.app/problems/event-not-found",
  "title":     "Event not found",
  "status":    404,
  "detail":    "No event with uid 'abc123'.",
  "instance":  "/v1/events/abc123",
  "requestId": "f4e8a1c2-9b2e-4d3a-9c4f-0f8b8d8e3d11"
}
```

Status codes:

| Status | Meaning | When | Recommended `Retry-After` |
| --- | --- | --- | --- |
| 200 | OK | Successful GET | — |
| 304 | Not Modified | `If-None-Match` or `If-Modified-Since` matches | — |
| 400 | Bad Request | Malformed query param (e.g. `limit=abc`, date range > 92 days) | — |
| 401 | Unauthorized | Webhook signature missing/invalid | — |
| 404 | Not Found | Unknown `uid` | — |
| 410 | Gone | Event withdrawn / deleted | — |
| 429 | Too Many Requests | Rate limit hit | `60` (seconds) |
| 500 | Internal Server Error | Unexpected; logged server-side | — |
| 501 | Not Implemented | Feature flag off (e.g. `?q=` before search ships) | — |
| 503 | Service Unavailable | Upstream scraper down | `120` |

### Caching — per-endpoint policy

Each endpoint declares its own policy in §1. Common headers:

- **Strong ETags required** on every cacheable response.
- **`Last-Modified`** required, RFC 7231 format.
- **`Vary: Accept-Encoding, Accept-Language`** required on every cacheable response.
- Conditional requests support **both** `If-None-Match` and `If-Modified-Since` → `304`.
- `HEAD` MUST be supported on every `GET` endpoint and return the same headers as a `GET` minus the body.

### Rate limiting — by layer

| Layer | Limit | Counter scope | Headers |
| --- | --- | --- | --- |
| **CDN edge** (Vercel / backend's CDN) | 600 req/min per IP across all paths | Edge node | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |
| **Origin** | 100 req/min per IP, only on cache misses | Origin-wide | Same headers |

Most traffic hits the edge and never sees origin. Origin limit protects the backend from cache-busting query-param combinations.

### Pagination

Cursor-based, forward-only. The browser's history stack handles backward navigation.

Request:
```
GET /v1/events?cursor=eyJpZCI6IjEyIn0&limit=20
```

Response envelope:
```json
{
  "data": [ /* items */ ],
  "page": {
    "nextCursor": "eyJpZCI6IjMyIn0",
    "hasMore":    true,
    "total":      147
  }
}
```

- `limit` default **20**, max **100**.
- `cursor` is opaque (base64 JSON server-side). Frontend never inspects it.
- `total` is the count **across all pages under the current filter set**.

### Localization

- `Accept-Language` honored with quality values. Examples:
  - `Accept-Language: en` → English content where available, source language otherwise.
  - `Accept-Language: sr-Latn` → Serbian Latin script preferred.
  - `Accept-Language: sr-Cyrl` → Serbian Cyrillic script preferred.
  - `Accept-Language: sr-Latn;q=0.9, sr;q=0.8, en;q=0.5` → graceful preference chain.
- Each event includes a `"language"` field with the **actual** language returned (BCP 47 tag). Frontend renders a "translated from …" hint if there's a mismatch.
- Server-side sorting uses `Collator(locale, { sensitivity: 'base' })` — never default ASCII sort. `'Žabac'` must sort after `'Apple'` and `'Ulica'`, not before.

### CORS

- `Access-Control-Allow-Origin`: production domain + Vercel preview pattern (no `*`).
- `Access-Control-Allow-Methods: GET, HEAD, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, If-None-Match, If-Modified-Since, Accept-Language, X-Request-ID`
- `Access-Control-Expose-Headers: ETag, Last-Modified, X-Request-ID, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset`
- `Access-Control-Allow-Credentials: false`
- `Access-Control-Max-Age: 86400`
- Preflight (`OPTIONS`) must return `204` with the above headers.

---

## 1. Endpoint summary

| Method | Path | Purpose | `Cache-Control` |
| --- | --- | --- | --- |
| `GET` / `HEAD` | `/v1/events` | Paginated, filterable feed | `public, s-maxage=600, stale-while-revalidate=86400` |
| `GET` / `HEAD` | `/v1/events/{uid}` | Single event detail | `public, s-maxage=3600, stale-while-revalidate=86400` |
| `GET` / `HEAD` | `/v1/facets` | Categories, cities, tags with counts | `public, s-maxage=3600, stale-while-revalidate=86400` |
| `GET` / `HEAD` | `/v1/health` | Uptime probe | `no-store` |
| `POST` | `/api/revalidate` *(on Vercel, called by backend)* | Trigger Next.js ISR purge | n/a |

That's it. Five endpoints. No more, no less.

---

## 2. `GET /v1/events`

The feed. Single most-called endpoint. Everything else is decoration.

### Query parameters

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `category` | string (enum) | — | Filter by exact category match |
| `city` | string | — | Filter by city slug (see Open Q #1 — controlled enum) |
| `tag` | string, repeatable | — | `?tag=jazz&tag=festival` |
| `tagMode` | `any` \| `all` | `any` | `any` = OR (default); `all` = AND across listed tags |
| `from` | `YYYY-MM-DD` | today (server-local) | Earliest `startsAt` date inclusive |
| `to` | `YYYY-MM-DD` | `from` + 30 days | Latest `startsAt` date **inclusive**. Range `to - from` ≤ **92 days**; greater → `400`. |
| `sort` | `timeline` \| `recent` | `timeline` | `timeline` = by `startsAt` asc; `recent` = by `createdAt` desc |
| `q` | string (1–80 chars) | — | Full-text search on title + description. If not yet implemented: `501 Not Implemented` + `Sunset` header showing planned date. |
| `cursor` | string | — | Pagination cursor from previous response |
| `limit` | integer 1–100 | 20 | Page size |

**Notes**
- All filters are AND-combined; tags inside `tag` follow `tagMode`.
- Unknown query params → ignored (forward-compatible).
- Invalid values → `400` with a problem document.

### Response 200

```json
{
  "data": [
    {
      "uid":         "evt_01HXYZABCDE",
      "title":       "Sunrise Via Ferrata",
      "description": "A guided climb up the rocky ridge…",
      "category":    "Adventure",
      "tags":        ["Via Ferrata", "Nature", "Guided", "Morning"],
      "city":        "Novi Sad",
      "location":    "Fruška Gora National Park",
      "startsAt":    "2026-04-29T06:30:00+02:00",
      "endsAt":      null,
      "allDay":      false,
      "timezone":    "Europe/Belgrade",
      "price": {
        "kind":     "free",
        "amount":   null,
        "currency": null,
        "display":  "Free"
      },
      "source": {
        "url":   "https://www.fruskagora.rs/events",
        "count": 3
      },
      "language":  "en",
      "status":    "live",
      "createdAt": "2026-04-28T14:20:00Z",
      "updatedAt": "2026-04-28T14:20:00Z"
    }
  ],
  "page": {
    "nextCursor": "eyJpZCI6IjIwIn0",
    "hasMore":    true,
    "total":      12
  }
}
```

### Field-level contract

| Field | Type | Notes |
| --- | --- | --- |
| `uid` | string | Opaque, stable for the life of the event. Format owned by backend (ULIDs recommended). |
| `title` | string, non-empty | Plain text. No HTML. |
| `description` | string \| null | Plain text. Newlines preserved. No HTML. |
| `category` | enum | One of: `Music`, `Adventure`, `Food & Drink`, `Education`, `Art`, `Wellness`. New values require a coordinated rollout with ≥ 90 days notice. |
| `tags` | string[] | Each tag is a display string. Adjacent duplicates (case/whitespace) must be deduped at ingestion. |
| `city` | string \| null | Display name. See Open Q #1 for canonical-slug discussion. |
| `location` | string \| null | Venue / address line; free text. |
| `startsAt` | ISO 8601 with offset | The event's local civil time. |
| `endsAt` | ISO 8601 with offset \| null | **Inclusive** of the final day for multi-day events. `null` = same-day event. |
| `allDay` | boolean | `true` when no time-of-day applies. When `true`, `startsAt` / `endsAt` are at `00:00` of the local day. |
| `timezone` | IANA zone string | E.g. `"Europe/Belgrade"`. Authoritative for DST resolution. |
| `price` | object | See below. |
| `source.url` | string (URL) \| null | Where the event was scraped from. |
| `source.count` | integer ≥ 1 | **Number of distinct upstream sources** that confirmed this event. Higher = more confidence. Capped at 999 (UI shows ≤ 5 dots). |
| `language` | BCP 47 tag | `"en"`, `"sr"`, `"sr-Latn"`, `"sr-Cyrl"`. The actual language returned for this object. |
| `status` | enum | `"live"` \| `"cancelled"` \| `"postponed"`. Cancelled events MUST still be returned within their date window — the frontend strikes them through. |
| `createdAt` | UTC ISO 8601 | First time the event entered the backend. |
| `updatedAt` | UTC ISO 8601 | Last meaningful change. Drives cache invalidation; equality with previous value ⇒ no UI churn. |

### `price` sub-schema

```ts
{
  kind:     "free" | "paid" | "unknown",
  amount:   number | null,    // smallest unit (e.g. cents); null when kind != "paid"
  currency: string | null,    // ISO 4217, e.g. "RSD", "EUR"; null when kind != "paid"
  display:  string            // localized human-readable, e.g. "1 200 RSD", "Free", "TBA"
}
```

Frontend prefers `display` for rendering, uses `kind`/`amount` for filtering.

### Sorting contract

- `sort=timeline`: `ORDER BY startsAt ASC, allDay DESC, uid ASC` (all-day events sort first within a day).
- `sort=recent`:   `ORDER BY createdAt DESC, uid DESC`.

Stable tiebreaker on `uid` is **mandatory** — otherwise cursor pagination duplicates rows.

---

## 3. `GET /v1/events/{uid}`

### Response 200

All feed fields **plus** a `details` object:

```json
{
  "uid": "evt_01HXYZABCDE",
  …all feed fields…,

  "details": {
    "longDescription":  "Full markdown-allowed description…",
    "directions": {
      "lat":     45.1421,
      "lng":     19.6839,
      "mapsUrl": "https://maps.google.com/?q=45.1421,19.6839"
    },
    "organizer": {
      "name": "Fruška Gora Outdoor",
      "url":  "https://fruskagora.rs"
    },
    "images": [
      {
        "url":      "https://cdn.gotovo.app/evt_01HXYZABCDE/hero.webp",
        "width":    1600,
        "height":   900,
        "blurhash": "LKO2?V%2Tw=w]~RBVZRi};RPxuwH",
        "alt":      "View from the ridge"
      }
    ],
    "links": [
      { "label": "Buy tickets",    "url": "https://…" },
      { "label": "Facebook event", "url": "https://…" }
    ]
  }
}
```

- `details.longDescription` MAY contain a safe subset of Markdown (CommonMark, no raw HTML). Frontend renders via `react-markdown` with HTML disabled.
- `details.directions` is `null` if no geocode is available.
- `details.images[]` may be empty. Frontend renders text-only layout when empty.

### Response 404 vs 410

- `404` if the `uid` never existed.
- `410 Gone` if the event was withdrawn from the catalog (still served for ≥ 30 days after withdrawal so shared links display the "removed" state).

---

## 4. `GET /v1/facets`

Powers the filter chips. Replaces the current client-side derivation, which won't scale past v1.

### Query parameters — facet-aware

| Param | Effect |
| --- | --- |
| `from`, `to` | Date window, same semantics as `/v1/events` |
| `category` | When present, **excluded** from the facet computation for `categories` (so the user can still switch). It IS applied to `cities` and `tags`. |
| `city` | When present, **excluded** from the facet computation for `cities`. It IS applied to `categories` and `tags`. |
| `tag` (repeatable) | When present, **excluded** from the facet computation for `tags`. They ARE applied to `categories` and `cities`. |
| `tagMode` | Same as `/v1/events` |

This is the standard "facet-aware" pattern. Selecting a filter never zeros-out the other chips in its own dimension.

### Response 200

```json
{
  "categories": [
    { "value": "Adventure",     "count": 5 },
    { "value": "Art",           "count": 2 },
    { "value": "Education",     "count": 3 },
    { "value": "Food & Drink",  "count": 4 },
    { "value": "Music",         "count": 8 },
    { "value": "Wellness",      "count": 1 }
  ],
  "cities": [
    { "value": "Belgrade", "count": 6 },
    { "value": "Novi Sad", "count": 17 }
  ],
  "tags": [
    { "value": "Jazz",    "count": 3 },
    { "value": "Outdoor", "count": 7 }
  ],
  "truncated": {
    "categories": false,
    "cities":     false,
    "tags":       false
  }
}
```

- Sort: `localeCompare` with the request's locale, `sensitivity: 'base'`.
- Tags capped at **200** entries; set `truncated.tags = true` past that. Above 200, the frontend switches to a searchable picker UI (see Open Q #4).
- Zero-count entries are **omitted** (they would clutter the UI).

---

## 5. `GET /v1/health`

```json
{
  "status":    "ok",
  "uptime":    3600,
  "version":   "1.4.2",
  "checkedAt": "2026-04-29T12:00:00Z"
}
```

- `200` while alive, even when degraded; use the `status` field (`"ok"` / `"degraded"` / `"down"`).
- `Cache-Control: no-store`.
- Used by uptime monitors and Vercel preview smoke tests. **Not** consumed by the UI.

---

## 6. `POST /api/revalidate` *(lives on the frontend, called by the backend)*

When new events land, the backend calls a Next.js route handler on Vercel to purge ISR for affected paths/tags. This is the only way to bypass `s-maxage`.

### Request

```
POST https://gotovo.app/api/revalidate
Content-Type:           application/json
X-Gotovo-Timestamp:     1745928000          # unix seconds, must be within 5 min of server clock
X-Gotovo-Signature:     sha256=<hex>        # HMAC-SHA256 over `${timestamp}.${rawBody}` with REVALIDATE_SECRET
X-Request-ID:           <uuid>

{
  "paths": ["/", "/event/evt_01HXYZABCDE"],
  "tags":  ["events:novi-sad", "events:music"]
}
```

### Constraints

- `paths.length + tags.length` ≤ **100** per request; greater → `400`.
- `X-Gotovo-Timestamp` skew > 300 s → `401` (replay defense).
- Missing or invalid `X-Gotovo-Signature` → `401`.
- Constant-time signature comparison server-side (no early-exit on first byte mismatch).
- Idempotent: replaying the same body within the freshness window is a no-op and still returns `200`.

### Response

```json
{ "revalidated": true, "at": "2026-04-29T12:00:00Z", "purged": { "paths": 2, "tags": 2 } }
```

### Why both `paths` and `tags`

- `paths` covers individual detail pages.
- `tags` covers feed pages filtered by, e.g. city — the frontend tags its `fetch()` calls with stable identifiers (`events:novi-sad`) and Next.js `revalidateTag()` invalidates all matching renders.

---

## 7. Validation contract (Zod schemas, frontend side)

Backend SHOULD generate from `openapi.yaml`; frontend MUST validate. Single source of truth for shapes.

```ts
// lib/api/schemas.ts
import { z } from 'zod';

const Money = z.object({
  kind:     z.enum(['free', 'paid', 'unknown']),
  amount:   z.number().int().nonnegative().nullable(),
  currency: z.string().length(3).nullable(),
  display:  z.string(),
});

const Source = z.object({
  url:   z.string().url().nullable(),
  count: z.number().int().min(1).max(999),
});

export const EventLanguage = z.enum(['en', 'sr', 'sr-Latn', 'sr-Cyrl']);
export const EventStatus   = z.enum(['live', 'cancelled', 'postponed']);
export const EventCategory = z.enum([
  'Music', 'Adventure', 'Food & Drink', 'Education', 'Art', 'Wellness',
]);

export const Event = z.object({
  uid:         z.string().min(1),
  title:       z.string().min(1),
  description: z.string().nullable(),
  category:    EventCategory,
  tags:        z.array(z.string()).max(50),
  city:        z.string().nullable(),
  location:    z.string().nullable(),
  startsAt:    z.string().datetime({ offset: true }),
  endsAt:      z.string().datetime({ offset: true }).nullable(),
  allDay:      z.boolean(),
  timezone:    z.string().min(1),
  price:       Money,
  source:      Source,
  language:    EventLanguage,
  status:      EventStatus,
  createdAt:   z.string().datetime(),
  updatedAt:   z.string().datetime(),
});

export const EventDetail = Event.extend({
  details: z.object({
    longDescription: z.string().nullable(),
    directions: z.object({
      lat:     z.number(),
      lng:     z.number(),
      mapsUrl: z.string().url(),
    }).nullable(),
    organizer: z.object({
      name: z.string(),
      url:  z.string().url().nullable(),
    }).nullable(),
    images: z.array(z.object({
      url:      z.string().url(),
      width:    z.number().int().positive(),
      height:   z.number().int().positive(),
      blurhash: z.string().nullable(),
      alt:      z.string(),
    })).max(20),
    links: z.array(z.object({
      label: z.string(),
      url:   z.string().url(),
    })).max(20),
  }),
});

export const Page = z.object({
  nextCursor: z.string().nullable(),
  hasMore:    z.boolean(),
  total:      z.number().int().nonnegative(),
});

export const EventsResponse = z.object({ data: z.array(Event), page: Page });

export const FacetsResponse = z.object({
  categories: z.array(z.object({ value: z.string(), count: z.number().int().positive() })),
  cities:     z.array(z.object({ value: z.string(), count: z.number().int().positive() })),
  tags:       z.array(z.object({ value: z.string(), count: z.number().int().positive() })),
  truncated: z.object({
    categories: z.boolean(),
    cities:     z.boolean(),
    tags:       z.boolean(),
  }),
});
```

If a response fails this schema in production, the frontend logs to Sentry and renders a graceful "Couldn't load events" state — **never** crashes the page.

---

## 8. OpenAPI 3.1 as single source of truth

Backend repo at `openapi.yaml`. Frontend generates types via:

```bash
npx openapi-typescript https://api.gotovo.app/v1/openapi.yaml -o src/lib/api/types.gen.ts
```

CI on frontend: regenerate, diff, fail PR if drift is unintended. Hand-written `interface Event { … }` is forbidden.

---

## 9. Non-functional requirements

Split by layer because the original mixed CDN and origin SLOs.

### CDN edge (Vercel / CDN in front of backend)

| Metric | Target |
| --- | --- |
| Cache hit ratio for `/v1/events` (10-min window) | ≥ 90% |
| P50 latency, cache hit | < 50 ms |
| P99 latency, cache hit | < 200 ms |

### Origin (backend)

| Metric | Target |
| --- | --- |
| P50 latency, cache miss, `/v1/events` | < 150 ms |
| P99 latency, cache miss, `/v1/events` | < 500 ms |
| P50 latency, `/v1/events/{uid}` | < 100 ms |
| Availability | ≥ 99.5% per calendar month |
| Payload size, feed page of 20 events | ≤ 50 KB gzipped, ≤ 30 KB brotli |
| Compression | `br` preferred, `gzip` fallback |
| Time skew tolerance | client/server clocks may differ ≤ 5 min; revalidate webhook enforces this |

---

## 10. Must-answer-before-signing questions

These are **not** open questions — they are contract gaps that block sign-off.

1. **City identity.** Free text or controlled enum with slugs? If enum, ship the canonical list (slug + display name + IANA zone if cities span zones). Frontend can't route `/c/novi-sad` without this.
2. **Tag governance.** Same question. Either dedupe at ingestion (lowercase + trim + collapse whitespace → display via a `displayName`) or expose a stable slug. The frontend cannot render `#OPEN-MIC` and `#Open Mic` as separate facets forever.
3. **Image pipeline.** Does the backend CDN accept `?w=…` for on-the-fly resizing, or does the frontend route through Vercel's image optimizer? Answer decides `loader:` in `next.config.js`.
4. **Tag count threshold for searchable picker.** The contract caps facets at 200, but at what real-world count should the frontend swap chip rows for a search input? Suggest **40** based on a typical mobile viewport.
5. **`q` search readiness.** Now, planned (give date), or never? Frontend code path differs.
6. **`source.count` cap.** Hard limit so the UI doesn't render "47 sources". Suggest 5 (matches the existing dot UI).

## 11. Open questions (truly open — can defer past signing)

1. **`Accept-Language: sr` default script** when the client doesn't specify Latn vs Cyrl. Latin is the safer default for v1; revisit with user data.
2. **Event "happening now" filter.** Useful but YAGNI — frontend can derive from `startsAt`/`endsAt` + `Date.now()`.
3. **RSS / iCal feeds.** Out of scope for v1 but the URL pattern (`/v1/events.rss`, `/v1/events/{uid}.ics`) should be reserved.

---

## Bottom line

**Five public endpoints, one webhook, one strict JSON contract.** Every field, every error, every cache header, every rate limit, every signature requirement is specified — no remaining "we'll figure it out". The only items left to negotiate (§10) block sign-off; the items in §11 don't.

Anything outside this document — auth, mutations, real-time, GraphQL, file upload, comments, RSVPs, push — is a separate contract revision.
