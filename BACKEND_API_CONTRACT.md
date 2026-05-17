# Gotovo — Backend API Contract (v1.2)

> Authoritative contract between the **Next.js frontend** (Vercel) and the **existing backend**. Every endpoint listed here is derived from a concrete need in the frontend — nothing speculative. Anything not listed is out of scope for v1.

---

## Changelog from v1.1

Phase −1 decision sweep applied. Each entry references the local issue tracker (`issues/NNNN-*.md`) and GitHub issue numbers.

| # | Change | Source |
| --- | --- | --- |
| 1 | `EventCategory` enum changed from contract-aspirational 6 (`Music`, `Adventure`, `Food & Drink`, `Education`, `Art`, `Wellness`) to backend's actual 9 (`HIKING`, `SPORTS`, `PARTY`, `WORKSHOP`, `EDUCATION`, `TRIP`, `CULTURE`, `ENTERTAINMENT`, `IT_NETWORKING`). Display names in new Appendix D. | Decision 0001 |
| 2 | `tags` field constrained to controlled 14-value vocabulary; examples replaced; Appendix C added with `ru`/`en` display names. Closes Open Q #2 and #4. | Decision 0002 |
| 3 | `city` field changed from `string \| null` to enum of 5 slugs (`belgrade`, `novi-sad`, `subotica`, `nis`, `kragujevac`). Appendix B added with display names, timezone, normaliser variants. Closes Open Q #1. | Decision 0003 |
| 4 | v1 ships with `details.images = []`; backend image pipeline deferred to v1.x. Closes Open Q #3. | Decision 0004 |
| 5 | Locale set narrows to `['ru', 'en']` for v1 UI; default `ru` at `/`; `en` at `/en/...` via `next-intl` `localePrefix: 'as-needed'`. Content language is `ru`. `EventLanguage` Zod enum amended to include `ru` first. Closes §11 Open Q #1. | Decision 0005 |
| 6 | `q` search returns `501 Not Implemented` with `Sunset: Tue, 01 Sep 2026 00:00:00 GMT`. Closes Open Q #5. | Decision 0006 |
| 7 | `source.url` canonical-selection rule specified: prefer public Telegram channels, highest `confidenceScore`, tiebreak by earliest `created_date`. Public URL form `https://t.me/{username}/{message_id}`; private fallback `tg://privatepost?...`. | Decision 0007 |
| 8 | Cursor pagination encoding nailed down: `{ "v": 1, "s": "timeline" \| "recent", "k": [...] }` base64url-encoded. Sort-mismatch → 400; filter-change tolerated. Compound indexes `idx_event_timeline` and `idx_event_recent` referenced in §9. | Decision 0008 |

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

Cursor-based keyset pagination, forward-only. The browser's history stack handles backward navigation.

Request:
```
GET /v1/events?cursor=eyJ2IjoxLCJzIjoidGltZWxpbmUiLCJrIjpbIjIwMjYtMDQtMjkiLCIwNjozMCIsImV2dF8wMUhYWVoiXX0&limit=20
```

Response envelope:
```json
{
  "data": [ /* items */ ],
  "page": {
    "nextCursor": "eyJ2IjoxLCJzIjoidGltZWxpbmUiLCJrIjpbIjIwMjYtMDUtMDEiLCIxOTowMCIsImV2dF8wMUhYWloiXX0",
    "hasMore":    true,
    "total":      147
  }
}
```

- `limit` default **20**, max **100**. Above 100 → `400` problem+json.
- `cursor` is opaque to clients. Internally it is `base64url(JSON.stringify(payload))` with no padding.
- Cursor payload shape (Decision 0008):
  ```json
  { "v": 1, "s": "timeline" | "recent", "k": [...sort-key tuple...] }
  ```
  - `v` is the encoding version. Mismatched version → `400`.
  - `s` is the sort mode the cursor was created for. If a request's `sort` differs from the cursor's `s`, server returns `400` with `"cursor sort mismatch — restart pagination"`. Other filter changes are tolerated: the same cursor applied to a different filter set produces well-defined boundary semantics without dropping data.
  - `k` is the sort-key tuple of the **last row of the previous page**:
    - `sort=timeline`: `[startDate, startTimeOrEmpty, uid]` (e.g. `["2026-04-29", "06:30", "evt_01HXYZ"]`; empty string for all-day events).
    - `sort=recent`: `[createdAtUtc, uid]` (e.g. `["2026-04-28T14:20:00Z", "evt_01HXYZ"]`).
- Malformed base64 / JSON / missing keys → `400` problem+json with `"invalid cursor"`.
- `nextCursor` is `null` when `hasMore=false`.
- `total` is the count **across all pages under the current filter set**. Computed via a separate `SELECT COUNT(*)` under the same filter; cacheable at the API layer when filter cardinality stays modest.
- Implementation detail (server-side, not user-facing): each query fetches `limit + 1` rows; if `limit + 1` returned, `hasMore = true` and the extra row is discarded before serialisation. Avoids a second COUNT for the common case.

### Localization

- **v1 UI locales**: `['ru', 'en']`. `ru` is the default and lives at the root path (`/`); English lives at `/en/...` via `next-intl` `localePrefix: 'as-needed'`. `sr-Latn` is deferred to v1.x — the schema below tolerates it for forward compatibility but the backend will not emit it.
- **Content language**: `ru`. ~99% of ingested Telegram posts are in Russian; the LLM extracts structured fields in Russian. The `language` field on each event is `'ru'` in v1.
- `Accept-Language` honored with quality values. Examples (post-Decision 0005):
  - `Accept-Language: ru` → Russian UI chrome + Russian content (default behaviour).
  - `Accept-Language: en` → English UI chrome; content stays Russian; UI renders an "Original: Russian" hint.
  - `Accept-Language: ru-RU;q=0.9, ru;q=0.8, en;q=0.5` → graceful preference chain; resolves to `ru`.
  - `Accept-Language: sr-Latn` → not v1; falls back to `ru` per default.
- Each event includes a `"language"` field with the **actual** content language (BCP 47 tag). In v1, this is always `"ru"`. Frontend renders an "Original: Russian" hint when active UI locale ≠ content language.
- Server-side sorting uses `Intl.Collator(locale, { sensitivity: 'base' })` — never default ASCII sort. Russian Cyrillic and Latin diacritics must collate correctly under both UI locales.

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
| `q` | string (1–80 chars) | — | Full-text search on title + description. **v1: always returns `501 Not Implemented`** with `Sunset: Tue, 01 Sep 2026 00:00:00 GMT` and `Link: <https://api.gotovo.app/v1/changelog>; rel="alternate"`. Activation tracked under Decision 0006. |
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
      "description": "Прогулка по Фрушка-Горе со сбором у вокзала.",
      "category":    "HIKING",
      "tags":        ["Outdoor", "Free", "Weekend"],
      "city":        "novi-sad",
      "location":    "Fruška Gora National Park",
      "startsAt":    "2026-04-29T06:30:00+02:00",
      "endsAt":      null,
      "allDay":      false,
      "timezone":    "Europe/Belgrade",
      "price": {
        "kind":     "free",
        "amount":   null,
        "currency": null,
        "display":  "Бесплатно"
      },
      "source": {
        "url":   "https://t.me/exampleChannel/12345",
        "count": 3
      },
      "language":  "ru",
      "status":    "live",
      "createdAt": "2026-04-28T14:20:00Z",
      "updatedAt": "2026-04-28T14:20:00Z"
    }
  ],
  "page": {
    "nextCursor": "eyJ2IjoxLCJzIjoidGltZWxpbmUiLCJrIjpbIjIwMjYtMDUtMDEiLCIxOTowMCIsImV2dF8wMUhYWVoiXX0",
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
| `category` | enum | One of (Decision 0001): `HIKING`, `SPORTS`, `PARTY`, `WORKSHOP`, `EDUCATION`, `TRIP`, `CULTURE`, `ENTERTAINMENT`, `IT_NETWORKING`. Display names per locale: see Appendix D. New values require a coordinated rollout with ≥ 90 days notice. |
| `tags` | string[] (controlled) | Each tag is one of the controlled vocabulary; see Appendix C. Cap 50 per event (vocabulary is 14 values, so cap is defensive). Adjacent duplicates impossible by construction. |
| `city` | enum \| null | One of (Decision 0003): `belgrade`, `novi-sad`, `subotica`, `nis`, `kragujevac`, or `null` when ingest cannot map the raw extracted city string to a known slug. Display names per locale + IANA timezone + normaliser variants: see Appendix B. |
| `location` | string \| null | Venue / address line; free text. |
| `startsAt` | ISO 8601 with offset | The event's local civil time. Composed at API layer from `(start_date, start_time, timezone)` columns; emitted with `+02:00` offset (or `+01:00` during DST) per `Europe/Belgrade`. |
| `endsAt` | ISO 8601 with offset \| null | **Inclusive** of the final day for multi-day events. `null` = same-day event. |
| `allDay` | boolean | `true` when no time-of-day applies. Derived from `start_time IS NULL`. When `true`, `startsAt` / `endsAt` are at `00:00` of the local day. |
| `timezone` | IANA zone string | E.g. `"Europe/Belgrade"`. Authoritative for DST resolution. All v1 events: `"Europe/Belgrade"`. |
| `price` | object | See below. |
| `source.url` | string (URL) \| null | Canonical Telegram message URL chosen per Decision 0007: public form `https://t.me/{username}/{message_id}` when available; private fallback `tg://privatepost?channel={absChannelId}&post={message_id}`; `null` only when zero sources (defensive). |
| `source.count` | integer ≥ 1 | **Number of distinct upstream sources** that confirmed this event. Higher = more confidence. Capped server-side at 5 (matches the 5-dot UI). |
| `language` | BCP 47 tag | Always `"ru"` in v1 (Decision 0005). Zod schema tolerates the full enum (`'ru' \| 'en' \| 'sr' \| 'sr-Latn' \| 'sr-Cyrl'`) for forward compatibility. |
| `status` | enum | `"live"` \| `"cancelled"` \| `"postponed"`. Cancelled events MUST still be returned within their date window — the frontend strikes them through. Backed by `event.status text NOT NULL DEFAULT 'live'` (Phase 0.5 migration). |
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

Parser heuristic (Phase 0.5 API layer maps backend's free-text `event.price text` column into the structured shape above): blank / literal `"Free"` / `"Бесплатно"` → `kind=free`, `amount=null`, `currency=null`, `display="Бесплатно"` (or English equivalent per `Accept-Language`); numeric-looking value with `RSD` / `EUR` / `Дин.` / `€` → `kind=paid` with parsed amount in smallest unit; everything else → `kind=unknown`, `display=<source text>`. v1 emits the heuristic verbatim; v1.x can swap in a better parser without contract change.

### Sorting contract

- `sort=timeline`: `ORDER BY start_date ASC, start_time ASC NULLS FIRST, uid ASC` (all-day events — `start_time IS NULL` — sort first within a day).
- `sort=recent`:   `ORDER BY created_date DESC, uid DESC`.

Stable tiebreaker on `uid` is **mandatory** — otherwise cursor pagination duplicates rows.

Backing indexes (Decision 0008, applied in the Phase 0.5 backend migration):
- `idx_event_timeline ON event (start_date, start_time NULLS FIRST, uid)`
- `idx_event_recent   ON event (created_date DESC, uid DESC)`

Source-attribution selection (Decision 0007): when multiple `event_source` rows back the same event, the canonical `source.url` is chosen by:
1. Prefer rows whose Telegram channel has a public username (`source.username IS NOT NULL`).
2. Within that subset, pick the row with the highest `extracted_payload.confidenceScore`.
3. Tiebreak by earliest `event_source.created_date`.
4. If no public sources exist, fall back to the same rule on private channels; `url` returned as `tg://privatepost?channel={absChannelId}&post={message_id}`.
5. Defensive: if no `event_source` rows exist (delete cascade race), `url=null, count=0`.

Public URL form: `https://t.me/{username}/{message_id}` (browser-renderable, opens Telegram preview).

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
    { "value": "HIKING",        "count": 5 },
    { "value": "CULTURE",       "count": 2 },
    { "value": "EDUCATION",     "count": 3 },
    { "value": "PARTY",         "count": 4 },
    { "value": "WORKSHOP",      "count": 8 },
    { "value": "IT_NETWORKING", "count": 1 }
  ],
  "cities": [
    { "value": "belgrade", "count": 6 },
    { "value": "novi-sad", "count": 17 }
  ],
  "tags": [
    { "value": "Outdoor", "count": 7 },
    { "value": "Free",    "count": 3 }
  ],
  "truncated": {
    "categories": false,
    "cities":     false,
    "tags":       false
  }
}
```

- Sort: `Intl.Collator(locale, { sensitivity: 'base' })` with the request's locale.
- `value` is the wire form for each dimension: `category` returns enum values (`HIKING`, …), `city` returns slugs (`belgrade`, `novi-sad`, …), `tags` returns vocabulary strings (`Outdoor`, `Free`, …). Display names are the frontend's responsibility via Appendices B / C / D.
- Tags capped at **200** entries; `truncated.tags = true` past that. v1 vocabulary is 14 entries — the cap is defensive. The "searchable picker over 40 tags" UI question (former Open Q #4) is closed as n/a per Decision 0002.
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

// Source: see "Sorting contract" in §2 for canonical-selection rule (Decision 0007).
// `url` may be `https://t.me/{username}/{message_id}` (public) or `tg://privatepost?...` (private fallback) or `null` (defensive).
// `count` is capped server-side at 5 to match the 5-dot UI.
const Source = z.object({
  url:   z.string().nullable(),  // not z.url() — `tg://` is a valid URI but fails standard URL parsers
  count: z.number().int().min(0).max(5),
});

// Decision 0005: backend emits only `ru` in v1; full enum tolerated for forward compatibility.
export const EventLanguage = z.enum(['ru', 'en', 'sr', 'sr-Latn', 'sr-Cyrl']);

export const EventStatus = z.enum(['live', 'cancelled', 'postponed']);

// Decision 0001: backend's 9-value vocabulary. Display names per locale in Appendix D.
export const EventCategory = z.enum([
  'HIKING', 'SPORTS', 'PARTY', 'WORKSHOP', 'EDUCATION',
  'TRIP', 'CULTURE', 'ENTERTAINMENT', 'IT_NETWORKING',
]);

// Decision 0002: controlled vocabulary (14 values). Display names per locale in Appendix C.
export const EventTag = z.enum([
  'Kids', 'Family', 'Outdoor', 'Indoor', 'Free', 'Paid', 'Beginner',
  'Advanced', 'Evening', 'Weekend', 'Nature', 'Urban', 'International', 'Online',
]);

// Decision 0003: 5-slug enum. Display names + timezone + normaliser variants in Appendix B.
export const EventCity = z.enum([
  'belgrade', 'novi-sad', 'subotica', 'nis', 'kragujevac',
]);

export const Event = z.object({
  uid:         z.string().min(1),
  title:       z.string().min(1),
  description: z.string().nullable(),
  category:    EventCategory,
  tags:        z.array(EventTag).max(50),
  city:        EventCity.nullable(),
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

### Index strategy (backing the SLOs above)

Required indexes on `event` (added in the Phase 0.5 Liquibase migration, Decision 0008):

- `idx_event_timeline ON event (start_date, start_time NULLS FIRST, uid)` — powers `sort=timeline` keyset pagination.
- `idx_event_recent ON event (created_date DESC, uid DESC)` — powers `sort=recent`.

These supersede the current `idx_event_start_date` (single-column) — drop it in the same migration after the compound index is in place.

---

## 10. Must-answer-before-signing questions

These were contract gaps that blocked sign-off. All closed in the Phase −1 decision sweep.

1. ~~**City identity.**~~ Closed by Decision 0003 — controlled 5-slug enum; see Appendix B.
2. ~~**Tag governance.**~~ Closed by Decision 0002 — controlled 14-value vocabulary; see Appendix C.
3. ~~**Image pipeline.**~~ Closed by Decision 0004 — v1 ships with `details.images = []`; backend image pipeline deferred to v1.x.
4. ~~**Tag count threshold for searchable picker.**~~ Closed by Decision 0002 — n/a, controlled vocabulary fits on a single chip row.
5. ~~**`q` search readiness.**~~ Closed by Decision 0006 — `501 Not Implemented` + `Sunset: Tue, 01 Sep 2026 00:00:00 GMT`.
6. ~~**`source.count` cap.**~~ Locked at **5** (matches the dot UI).

## 11. Open questions (truly open — can defer past signing)

1. ~~**`Accept-Language: sr` default script.**~~ Closed by Decision 0005 — `sr` is not a v1 UI locale; deferred to v1.x.
2. **Event "happening now" filter.** Useful but YAGNI — frontend can derive from `startsAt`/`endsAt` + `Date.now()`.
3. **RSS / iCal feeds.** Out of scope for v1 but the URL pattern (`/v1/events.rss`, `/v1/events/{uid}.ics`) should be reserved.

---

## Appendix A — reserved

Reserved for a future cross-reference table.

## Appendix B — Cities (Decision 0003)

| Slug         | Display (ru)  | Display (en) | Timezone        | Normaliser variants (examples)                              |
|--------------|---------------|--------------|-----------------|-------------------------------------------------------------|
| `belgrade`   | Белград       | Belgrade     | Europe/Belgrade | `Belgrade`, `Beograd`, `Београд`, `Белград`, `BG`           |
| `novi-sad`   | Нови-Сад      | Novi Sad     | Europe/Belgrade | `Novi Sad`, `Novi-Sad`, `Нови Сад`, `Нови-Сад`, `NS`        |
| `subotica`   | Суботица      | Subotica     | Europe/Belgrade | `Subotica`, `Суботица`, `Szabadka` (Hungarian)              |
| `nis`        | Ниш           | Niš          | Europe/Belgrade | `Nis`, `Niš`, `Ниш`                                         |
| `kragujevac` | Крагуевац     | Kragujevac   | Europe/Belgrade | `Kragujevac`, `Крагујевац`, `Крагуевац`, `KG`               |

Normaliser matching: case-insensitive, Unicode-NFC-folded, whitespace-collapsed, hyphen/space-equivalent. ASCII-fold optional for matching; never for display (`Niš` keeps the glyph; URL slug is `nis`).

Frontend `lib/constants/cities.ts` mirrors this table. Backend's ingestion normaliser is the authoritative source; the frontend list is presentation-only.

When N approaches ~20 cities or runtime city management is required, migrate from enum to a `city` schema table (per Decision 0003's Option C reference plan).

## Appendix C — Tag vocabulary (Decision 0002)

| Tag             | Display (ru)         | Display (en)    |
|-----------------|----------------------|-----------------|
| `Kids`          | Дети                 | Kids            |
| `Family`        | Семья                | Family          |
| `Outdoor`       | На открытом воздухе  | Outdoor         |
| `Indoor`        | В помещении          | Indoor          |
| `Free`          | Бесплатно            | Free            |
| `Paid`          | Платно               | Paid            |
| `Beginner`      | Для начинающих       | Beginner        |
| `Advanced`      | Продвинутый уровень  | Advanced        |
| `Evening`       | Вечер                | Evening         |
| `Weekend`       | Выходные             | Weekend         |
| `Nature`        | Природа              | Nature          |
| `Urban`         | Город                | Urban           |
| `International` | Международный        | International   |
| `Online`        | Онлайн               | Online          |

Wire form is the English key (`Outdoor`, `Free`, …). Display per active UI locale via the table above. Russian display values are first-pass drafts; revisit with a native speaker before broad release.

## Appendix D — Category display names (Decision 0001)

| Enum value       | Display (ru)            | Display (en)    |
|------------------|-------------------------|-----------------|
| `HIKING`         | Походы                  | Hiking          |
| `SPORTS`         | Спорт                   | Sports          |
| `PARTY`          | Вечеринки               | Party           |
| `WORKSHOP`       | Мастер-классы           | Workshop        |
| `EDUCATION`      | Образование             | Education       |
| `TRIP`           | Поездки                 | Trip            |
| `CULTURE`        | Культура                | Culture         |
| `ENTERTAINMENT`  | Развлечения             | Entertainment   |
| `IT_NETWORKING`  | IT и нетворкинг         | IT/Networking   |

Wire form is the enum value (`HIKING`, …). Backend's existing English display-name map in `gotovo-backend/shared/src/main/kotlin/space/cloaq/shared/constant/EventCategory.kt` is authoritative for the English column. Russian display values are first-pass drafts subject to native-speaker review; if a reviewer is unavailable at merge time, ship with English-only fallback for any row whose Russian translation has not been confirmed.

---

## Bottom line

**Five public endpoints, one webhook, one strict JSON contract.** Every field, every error, every cache header, every rate limit, every signature requirement is specified — no remaining "we'll figure it out". Phase −1 decisions closed every Open Question in §10 and resolved one of three in §11.

Anything outside this document — auth, mutations, real-time, GraphQL, file upload, comments, RSVPs, push — is a separate contract revision.
