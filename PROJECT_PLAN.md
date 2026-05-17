# Gotovo — Project Specification & Implementation Plan

> Comprehensive review, specification, and execution plan for the Gotovo event-discovery web app.
> Audience: lead engineer, design lead, project owner.
> Status: draft v1.0 — supersedes nothing, complements `FRONTEND_STACK_ANALYSIS.md` and `BACKEND_API_CONTRACT.md`.

---

## Table of contents

1. [State of the project — audit](#1-state-of-the-project--audit)
2. [Specification (what we are building)](#2-specification-what-we-are-building)
3. [Architecture](#3-architecture)
4. [Implementation plan](#4-implementation-plan)
5. [Definition of done](#5-definition-of-done)
6. [Risks & mitigations](#6-risks--mitigations)
7. [Appendix — file & folder layout](#7-appendix--file--folder-layout)

---

## 1. State of the project — audit

### 1.1 What exists

| Asset | Status | Notes |
| --- | --- | --- |
| `Gotovo.html` (this project's prototype) | ✅ Visual reference complete | Single-file React+Babel demo; not production code |
| `FRONTEND_STACK_ANALYSIS.md` | ✅ Reviewed, current | Stack recommendations |
| `BACKEND_API_CONTRACT.md` v1.1 | ✅ Reviewed, current | Five public endpoints + revalidate webhook |
| Next.js codebase (`uploads/b_L9NGMYx2uNe/`) | ⚠️ Scaffold only — needs productionization | Next 16.2.4, React 19.2.4, Tailwind v4, fonts wired, Radix installed |
| Design tokens (CSS variables) | ✅ Light + dark themes complete | `app/globals.css` |
| Mock data (`lib/data.ts`) | ⚠️ Hardcoded, must be replaced with fetcher | 12 events, faithful to schema |
| Pure utilities (`lib/event-utils.ts`) | ✅ Production-quality, testable | `filterEvents`, `groupEventsByDate`, `getCategoryStyle`, etc. |
| `app/page.tsx` | ⚠️ Fully client-side; no SSR data fetching | All state in `useState` |
| `components/gotovo/*.tsx` | ✅ Atomic, SOLID-compliant | Header, TabBar, FilterZone, Feed, EventCard, DetailPage, Chip, Pill, EmptyState |
| `components/icons.tsx` | ✅ Hand-rolled, consistent | Should migrate to `lucide-react` for tree-shaking |
| Theme handling | ⚠️ `useState` + `useEffect` + `document.documentElement` | `next-themes` is installed but unused |

### 1.2 What's missing (production gaps)

Ordered by impact:

1. **No data-fetching layer.** `EVENTS` is a hardcoded constant. The backend exists but nothing talks to it.
2. **No URL state.** Filter state lives in `useState`, so filtered views are not shareable and reload loses state.
3. **Detail is a modal, not a route.** `/event/{uid}` doesn't exist; deep links impossible.
4. **No tests** of any kind. The pure functions in `event-utils.ts` are textbook unit-test targets and trivially testable.
5. **No CI.** No lint gate, no typecheck gate, no test gate.
6. **No error boundaries** (`error.tsx`, `not-found.tsx`, `loading.tsx` missing throughout `app/`).
7. **No env validation.** No `.env` schema; no T3-env or Zod-based env guard.
8. **No i18n.** Serbian content with English-only UI is a hard ceiling on the audience.
9. **No PWA.** No manifest, no service worker, no offline shell.
10. **No image strategy.** Cards have no slot for hero imagery; `images.unoptimized: true` would ship full-size when they arrive.
11. **No analytics events.** `@vercel/analytics` is installed but only auto-pageview firing — no custom events for filter use, event detail opens, share clicks.
12. **No Sentry** or any other error reporting.

### 1.3 What's wrong (production-hostile config / patterns)

These are **bugs**, not gaps:

| Defect | Severity | Where |
| --- | --- | --- |
| `typescript.ignoreBuildErrors: true` | **High** — hides real type errors at build | `next.config.mjs` |
| `images.unoptimized: true` | **High** — ships full-size images, hurts CWV | `next.config.mjs` |
| Theme toggle uses `document.documentElement.classList.toggle('dark', …)` directly | **Medium** — hydration mismatch risk; `next-themes` is installed but ignored | `app/page.tsx` |
| `REFERENCE_TIME` is a hardcoded constant in 2026 | **Medium** — "New" badge will be wrong in prod | `lib/event-utils.ts` |
| `ALL_CITIES.sort()` uses default ASCII collation | **Medium** — wrong for Serbian (`'Žabac' < 'Apple'` is false in `sr` locale, true in ASCII) | `lib/data.ts` |
| ~30 unused Radix packages installed | **Low** — install bloat, audit noise | `package.json` |
| `lib/data-6f074227.ts` and `lib/data.ts` both exist (export contains both versions) | **Low** — repository hygiene | `uploads/` |
| `generator: 'v0.app'` left in metadata | **Low** — cosmetic / supply-chain signal | `app/layout.tsx` |
| No `.nvmrc` / `engines` in `package.json` | **Low** — Node version drift between devs | root |
| `tsconfig.json` strictness not verified | **Medium** — recommend `noUncheckedIndexedAccess` etc. | root |

### 1.4 What's right (do not change)

- Tailwind v4 + CSS-variable token system. Excellent foundation.
- Atomic component split. Pill/Chip/InfoCell are tiny and single-purpose.
- Pure-function utility layer in `event-utils.ts`. Easy to test, easy to replace.
- `next/font/google` already wired correctly.
- Discriminated union for `EventCategory`. Strict TypeScript.
- Light/dark theme tokens covering surfaces, semantic colors, dividers — comprehensive.

The prototype demonstrated the visual direction is right. Don't redesign; productionize.

---

## 2. Specification (what we are building)

### 2.1 Product summary

Gotovo is a **read-only event discovery web app** for Novi Sad and Belgrade. It aggregates events from multiple sources, deduplicates them, and presents a filtered, browsable feed. Users can:

- Browse a chronological "Timeline" or "Recently Added" feed.
- Filter by category, city, and tags.
- Open detail pages with location, times, price, source attribution.
- Share specific events and filtered views via URL.
- Install the site as a PWA on mobile.

### 2.2 v1 scope — IN

| # | Requirement | Acceptance criteria |
| --- | --- | --- |
| F1 | Feed view with Timeline + Recently Added tabs | Both tabs render with grouping headers and accurate counts; switching tabs preserves filters |
| F2 | Category / city / tag filters | Filter combinations work via URL params; deep links restore exact filter state |
| F3 | Event detail page at `/event/{uid}` | Pasted URL renders the event with full metadata; back returns to feed at correct scroll position |
| F4 | Modal-style detail-over-feed UX | Clicking a card opens the detail as an intercepted parallel route (Next.js `@modal` slot) |
| F5 | Light/dark theme with persistence | No FOUC on first paint; respects `prefers-color-scheme`; user choice persists |
| F6 | Empty state | Renders when no events match active filters; CTA to clear filters |
| F7 | Localized content (en + sr-Latn) | UI strings + dates render per `Accept-Language` and explicit toggle; locale survives reload |
| F8 | Backend integration with Zod-validated boundary | Feed and detail hit `/v1/events` and `/v1/events/{uid}`; schema violations log to Sentry, render error state |
| F9 | ISR with on-demand revalidation | Backend posts to `/api/revalidate` with HMAC; affected pages purge within seconds |
| F10 | PWA installability | Manifest, icons, offline shell via Serwist; Chrome/Safari install prompt eligible |
| F11 | Analytics on key actions | Filter applied, detail opened, source clicked — captured to Vercel Analytics |
| F12 | Error reporting | Sentry captures uncaught client + server errors with request ID correlation |
| F13 | Accessibility | Lighthouse a11y ≥ 95; full keyboard navigation; focus restored on modal close; ARIA roles on tabs and chips |
| F14 | Mobile-first responsive layout | 320 – 1440px tested; touch targets ≥ 44px |

### 2.3 v1 scope — OUT (rejected for now, with rationale)

| Feature | Why not in v1 |
| --- | --- |
| User auth, accounts, profiles | No feature requires identity yet |
| "Save event" / favorites | Depends on auth |
| Event submission by organizers | Trust + moderation cost not justified pre-traffic |
| Comments, ratings, RSVPs | Same |
| Push notifications | PWA install first; notifications later |
| Maps with pins | Single-event `mapsUrl` link covers the use case |
| Calendar export (.ics) | Backend can add `?format=ics` later; YAGNI for v1 |
| Native mobile apps | PWA covers 95% of value |
| Server-side translation | Backend returns multi-locale data per `Accept-Language` |
| Free-text search UI | Hidden behind backend `q` readiness (Open Q #5) |
| Recommendations / personalization | No data to power it yet |

### 2.4 Non-functional requirements

| NFR | Target | How measured |
| --- | --- | --- |
| **LCP** (Largest Contentful Paint) | < 2.0 s on 4G mobile | Vercel Speed Insights, real-user data |
| **INP** (Interaction to Next Paint) | < 200 ms p75 | Vercel Speed Insights |
| **CLS** | < 0.05 | Vercel Speed Insights |
| **First-load JS** | ≤ 120 KB gzipped on `/` | `@next/bundle-analyzer` in CI |
| **Lighthouse a11y** | ≥ 95 | Lighthouse CI on every PR |
| **Type coverage** | 100% strict (`strict: true`, `noUncheckedIndexedAccess: true`) | `tsc --noEmit` in CI |
| **Test coverage** | ≥ 80% on `lib/` (pure functions); ≥ 60% overall | Vitest coverage in CI |
| **Lint** | Zero warnings | Biome `ci` in CI |
| **Build** | Zero TypeScript errors with `ignoreBuildErrors: false` | `next build` in CI |
| **Bundle budget** | Fail PR if first-load JS grows > 10 KB | bundle-analyzer + threshold |

### 2.5 Browser & device support

| Tier | Browsers | Coverage commitment |
| --- | --- | --- |
| **Tier 1** (full) | Last 2 versions: Chrome, Safari (iOS + macOS), Firefox, Edge | Pixel-perfect, full feature set |
| **Tier 2** (functional) | Samsung Internet, Opera, in-app webviews (FB/IG/Twitter) | Functional; visual fidelity acceptable |
| **Tier 3** (graceful) | iOS Safari ≤ 15, Chrome ≤ 110 | App loads, core feed visible; PWA install may be unavailable |
| **Not supported** | IE11, Opera Mini | Render an "Update your browser" page |

---

## 3. Architecture

### 3.1 Top-level shape

```
┌─────────────────────────────────────────────────────────┐
│ Vercel Edge (CDN, ISR cache, function entry)            │
└───────────────────────┬─────────────────────────────────┘
                        │
            ┌───────────▼────────────┐
            │  Next.js 16 App Router │
            │  (RSC + Server Actions)│
            └───────────┬────────────┘
                        │
        ┌───────────────┼───────────────────┐
        │               │                   │
        ▼               ▼                   ▼
  ┌──────────┐   ┌────────────┐    ┌────────────────┐
  │ Backend  │   │  Sentry    │    │  Vercel        │
  │ API      │   │  (errors)  │    │  Analytics     │
  │ /v1/...  │   └────────────┘    │  + Speed       │
  └──────────┘                     │  Insights      │
                                   └────────────────┘
```

### 3.2 Rendering strategy

| Route | Strategy | Why |
| --- | --- | --- |
| `/` (feed) | RSC + ISR (`revalidate: 600`) | Identical for all users in a given filter set; CDN-cacheable |
| `/event/[uid]` (detail page) | RSC + ISR with `generateStaticParams` for popular events | SEO + sub-100 ms loads |
| `/@modal/(.)event/[uid]` (modal slot) | Client (uses the same RSC fetch via cache) | Smooth modal-over-feed UX |
| `/api/revalidate` | Edge route handler | HMAC-verified webhook from backend |

**No mutations in v1**, so no Server Actions, no `/api/*` write routes.

### 3.3 State management

| State | Source of truth |
| --- | --- |
| Filters (category, city, tags, date range, tab) | **URL search params** via `nuqs` |
| Theme | `next-themes` (cookie) |
| Locale | `next-intl` segment (`/en/...`, `/sr/...`) |
| Detail modal open/closed | Route (intercepted parallel route) |
| Form fields (future) | `react-hook-form` |
| Server data | Server components only; no client-side cache for the feed (it's cacheable upstream) |
| Optimistic interactions (future) | `useOptimistic` |

**Explicit non-goals**: Redux, Zustand, Jotai, Recoil, MobX, XState. None required.

### 3.4 Data flow — feed

```
URL params (?cat=Music&city=Novi+Sad)
   ↓
Server Component reads params (nuqs server adapter)
   ↓
lib/api/events.ts → fetch(/v1/events?...) with next: { revalidate: 600, tags: ['events'] }
   ↓
Zod validation (lib/api/schemas.ts) — throws on schema drift, caught by error boundary
   ↓
Component tree (Feed → DateGroup → EventCard)
```

### 3.5 Data flow — detail

```
/event/[uid] requested
   ↓
generateStaticParams: top 200 events pre-rendered at build
   ↓
fetch(/v1/events/{uid}) with next: { revalidate: 3600, tags: ['event:{uid}'] }
   ↓
Zod validation → 404 page if event missing, "removed" state if 410
```

### 3.6 Theme + locale

- **Theme**: `next-themes` provider in root layout, `attribute="class"`, `defaultTheme="system"`, `enableSystem`. Persisted via cookie (SSR-friendly, no FOUC).
- **Locale**: `next-intl` with `[locale]` segment. Two locales: `en`, `sr` (Latin script default for v1). Middleware detects `Accept-Language` on first visit.

### 3.7 Error handling

| Layer | Mechanism |
| --- | --- |
| Server fetch fails / non-2xx | Throw `ApiError`; caught by route `error.tsx`, renders friendly UI |
| Response fails Zod | Throw `SchemaError`; logged to Sentry with request ID; renders same error UI |
| Network offline | Service worker serves last-cached feed + offline banner |
| 404 (unknown uid) | `not-found.tsx` |
| Detail loaded but `status: "cancelled"` | Rendered with strike-through + cancelled banner (not an error) |

### 3.8 Caching layers

```
Browser (SW + HTTP cache)
    ↓ miss
Vercel Edge CDN (s-maxage from backend, plus Next ISR)
    ↓ miss
Backend API
```

Revalidation:
- **Time-based**: 10 min for feed, 1 h for detail/facets.
- **On-demand**: backend HMAC-posts to `/api/revalidate` with `paths` + `tags` when events change.
- **Tag scheme**: `events`, `events:city:{slug}`, `events:cat:{slug}`, `event:{uid}` — granular invalidation.

### 3.9 Folder layout (target)

See [§7 Appendix](#7-appendix--file--folder-layout) for the full tree.

---

## 4. Implementation plan

Six phases, each ~1 week of focused work, each independently shippable. **Phase 0 is non-negotiable**; phases 4–5 can be reordered based on user demand.

### Phase 0 — Foundation (week 1)

**Goal**: production-safe baseline before adding features. No new UI in this phase.

| Task | Deliverable | Acceptance |
| --- | --- | --- |
| 0.1 Remove dangerous config | `next.config.mjs` without `ignoreBuildErrors` or `unoptimized` | `next build` passes |
| 0.2 Tighten TS | `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes` in `tsconfig.json` | `tsc --noEmit` passes |
| 0.3 Install Biome, remove ESLint + Prettier configs | `biome.json` + `pnpm lint` script | `pnpm lint` reports zero issues |
| 0.4 Add `engines` + `.nvmrc` | Node 20+ pinned | CI uses pinned version |
| 0.5 Prune unused Radix packages | `package.json` only includes Radix primitives we actually use (probably: dialog, popover, dropdown, tooltip — verify with `depcheck`) | `pnpm install` bundle savings documented |
| 0.6 Set up Vitest + Playwright | `vitest.config.ts`, `playwright.config.ts`, smoke tests run | `pnpm test` and `pnpm e2e` green |
| 0.7 GitHub Actions CI | Workflow: typecheck, lint, test, build, bundle-size check | PRs blocked on red CI |
| 0.8 Port existing pure functions to tests | `lib/event-utils.test.ts` covers `filterEvents`, `groupEventsByDate`, `groupEventsByRecency`, `isNewEvent`, `getCategoryStyle`, `getPriceStyle`, `daysBetween` | ≥ 95% coverage on `lib/event-utils.ts` |
| 0.9 Add `app/error.tsx`, `app/not-found.tsx`, `app/loading.tsx` | Friendly fallbacks at root | Triggering each renders correctly |
| 0.10 Env schema | `lib/env.ts` validates `NEXT_PUBLIC_API_BASE_URL`, `REVALIDATE_SECRET`, `SENTRY_DSN`, etc., with Zod at boot | Boot fails fast on missing/invalid env |
| 0.11 Replace direct theme toggle with `next-themes` | Theme cookie persists; no hydration warning | DevTools console clean across reloads |

**Exit criteria**: green CI on a no-op change.

---

### Phase 1 — Backend integration (week 2)

**Goal**: replace `lib/data.ts` constants with a real fetcher that hits the backend API.

| Task | Deliverable | Acceptance |
| --- | --- | --- |
| 1.1 OpenAPI codegen | `pnpm gen:api` runs `openapi-typescript`, produces `lib/api/types.gen.ts` | CI fails if types drift from spec |
| 1.2 Zod schemas | `lib/api/schemas.ts` matches contract §7 exactly | Unit tests assert sample-response parses |
| 1.3 Typed API client | `lib/api/client.ts` with `getEvents`, `getEvent`, `getFacets`, `getHealth` — each: builds URL, fetches, validates, returns typed data | Unit tests with `msw` covering happy path + 404 + schema mismatch |
| 1.4 Adapter from API shape → existing component props | `lib/api/adapters.ts`: maps `startsAt`/`endsAt`/`timezone` → the `startDate`+`startTime` shape components expect, OR refactor components to use the new shape directly (preferred) | All existing components compile and render |
| 1.5 Refactor `app/page.tsx` to RSC | Server component fetches feed; client component handles interactivity (filters, modal) | Page renders without `'use client'` at top level |
| 1.6 ISR + tags | `fetch(url, { next: { revalidate: 600, tags: ['events', ...] } })` | `next dev` shows tagged caches; manual `revalidatePath()` works |
| 1.7 `/api/revalidate` route | HMAC-verified webhook calls `revalidatePath()` / `revalidateTag()` | Integration test posts mock webhook, verifies tag invalidation |
| 1.8 Delete `lib/data.ts` (mock) | Mock data lives in `__fixtures__/` for tests only | No production import path references it |

**Exit criteria**: home page loads real backend data; refreshing within 10 min returns cached HTML; on-demand revalidate purges within 2 s.

---

### Phase 2 — Routing & URL state (week 3)

**Goal**: deep-linkable filters + detail pages.

| Task | Deliverable | Acceptance |
| --- | --- | --- |
| 2.1 Install `nuqs` | All filter state moved to URL params | Pasting `?cat=Music&city=Novi+Sad` restores filter UI |
| 2.2 `/event/[uid]` route | RSC page that fetches single event | Visiting `/event/{valid-uid}` shows full detail |
| 2.3 `generateStaticParams` for popular events | Build pre-renders top N (configurable) | `next build` output shows static event pages |
| 2.4 Intercepted parallel route `@modal/(.)event/[uid]` | Clicking a card from feed opens modal; URL is `/event/{uid}`; refresh shows full-page detail | Back button returns to feed at correct scroll |
| 2.5 `not-found.tsx` on `/event/[uid]` | Friendly 404 with link home | Bad uid renders the page |
| 2.6 Cancelled / gone state | If API returns `status: "cancelled"` or 410, render withdrawal UI | Manual test with mocked response |
| 2.7 Scroll restoration | Feed scroll position preserved across modal open/close | Verified across browsers |

**Exit criteria**: shareable filter URLs work; `/event/12` is shareable; back button is correct everywhere.

---

### Phase 3 — Theme, locale, fonts polish (week 4)

**Goal**: production-quality theming and Serbian content support.

| Task | Deliverable | Acceptance |
| --- | --- | --- |
| 3.1 `next-themes` correctly configured | Cookie-based, system-aware, no FOUC | Lighthouse "No flash of unstyled content" |
| 3.2 `next-intl` scaffolding | `[locale]` segment, `messages/en.json`, `messages/sr.json` | Visiting `/sr` swaps UI strings |
| 3.3 Middleware locale detection | First visit reads `Accept-Language`, redirects to best match | Manual test with locale headers |
| 3.4 Replace custom `WEEK_DAYS`/`MONTHS` with `Intl.DateTimeFormat` | `lib/datetime.ts` exports `formatDateLong(date, locale)` | Tests pass for both en and sr |
| 3.5 Locale-aware sort | `lib/sort.ts` uses `Intl.Collator` | Cyrillic + diacritic test cases pass |
| 3.6 Theme/locale on Server Components | No `'use client'` needed for either | Lighthouse score unchanged |

**Exit criteria**: app fully functional in en + sr; no hydration warnings; theme toggle smooth.

---

### Phase 4 — Observability & analytics (week 5)

| Task | Deliverable | Acceptance |
| --- | --- | --- |
| 4.1 Install `@sentry/nextjs` with tunnel route | Errors captured server + client | Trigger error in staging, see it in Sentry |
| 4.2 Wire request ID through Sentry | Every error tagged with `X-Request-ID` from API | Cross-system trace works |
| 4.3 Custom analytics events | `track('filter_applied', { category, city, tag_count })`, `track('event_opened', { uid })`, `track('source_clicked', { uid })` | Events appear in Vercel Analytics dashboard |
| 4.4 Speed Insights | `<SpeedInsights />` in layout | Real CWV data visible after 24 h |
| 4.5 Bundle size budget | CI fails PRs that grow first-load JS > 10 KB | Threshold enforced |

**Exit criteria**: every crash auto-reported with context; every key action has an analytics event.

---

### Phase 5 — PWA + offline (week 6)

| Task | Deliverable | Acceptance |
| --- | --- | --- |
| 5.1 Install `@serwist/next` | Service worker generated at build | Lighthouse PWA audit passes |
| 5.2 Manifest + icons | `public/manifest.webmanifest`, 192/512 PNGs, maskable variants, apple-touch | Install prompt triggers in Chrome Android |
| 5.3 Offline shell | Cached `/offline` page when network fails | Toggle DevTools offline → app loads with banner |
| 5.4 Runtime caching strategy | Stale-while-revalidate for API; cache-first for static | Verified via DevTools Application panel |
| 5.5 Update prompt | Toast when new SW available; user-clickable refresh | Manual deploy → prompt appears |

**Exit criteria**: Lighthouse PWA score 100; installable on iOS + Android.

---

### Phase 6 — Hardening & launch (week 7)

| Task | Deliverable | Acceptance |
| --- | --- | --- |
| 6.1 Playwright critical paths | Tests: load feed, apply filter, open detail, share link, install PWA | Green in CI |
| 6.2 `@axe-core/playwright` a11y gate | Zero violations on home, feed, detail | CI fails on new violations |
| 6.3 Lighthouse CI | Performance ≥ 90, a11y ≥ 95, best-practices ≥ 95, SEO ≥ 95 | Thresholds enforced per PR |
| 6.4 robots.txt + sitemap.ts | Dynamic sitemap fed by API event list | Validated with Google Search Console |
| 6.5 Open Graph + Twitter cards | Per-event metadata on `/event/{uid}` | Twitter Card Validator green |
| 6.6 Privacy + cookie policy stubs | `/privacy`, `/terms` pages | Linked in footer |
| 6.7 Production smoke test playbook | Documented manual checklist for releases | Used for v1 launch |
| 6.8 Documentation | `README.md` describes setup, env, scripts, deploys | A new dev can clone + run in < 10 min |

**Exit criteria**: app is launchable.

---

### Effort summary

| Phase | Focus | Effort (engineer-weeks) | Risk |
| --- | --- | --- | --- |
| 0 | Foundation | 1 | Low |
| 1 | Backend integration | 1 | **High** (depends on backend readiness) |
| 2 | Routing & URL state | 1 | Low |
| 3 | Theme & locale | 1 | Medium (locale content authoring) |
| 4 | Observability | 0.5 | Low |
| 5 | PWA | 0.5 | Low |
| 6 | Hardening | 1 | Medium |
| **Total** | | **~6 engineer-weeks** for a single senior engineer | |

Two engineers in parallel: Phase 0 in week 1, then 1+2 in parallel, then 3+4 in parallel, then 5+6 in parallel → **3.5 calendar weeks**.

---

## 5. Definition of done

A phase is "done" when **all** of the following are true:

1. All tasks in the phase have green CI on their PRs.
2. New code has tests (unit, integration, or e2e as appropriate).
3. No regressions in the bundle budget or Lighthouse scores.
4. No new TypeScript `any`, no new `@ts-ignore`, no new lint disables.
5. Documentation (`README`, code comments, architecture notes) updated.
6. The phase's exit criteria are demonstrably met in the deployed preview.

The project is "v1 launchable" when:

- All NFRs in §2.4 are met in production-like staging.
- A new developer can clone, install, configure env, and have the dev server running in ≤ 10 minutes.
- Backend Open Questions §10.1–§10.6 in `BACKEND_API_CONTRACT.md` are answered and reflected in the contract.

---

## 6. Risks & mitigations

| # | Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | Backend contract changes mid-implementation | High | High | OpenAPI spec is the single source of truth; codegen runs in CI; backend signs contract before Phase 1 starts |
| R2 | Backend not ready when Phase 1 begins | High | High | Stub backend with `msw` against the OpenAPI spec so frontend can develop in parallel |
| R3 | Serbian content quality (translation drift, mojibake) | Medium | Medium | Native-speaker review of locale files; CI lint for `\u003F` mojibake patterns; freeze translations per release |
| R4 | PWA install rate disappointment | Medium | Low | Treat as nice-to-have; don't block launch on install metrics |
| R5 | Real images break card layout | High | Medium | Design the image slot in Phase 0; even if backend doesn't ship images yet, reserve the space |
| R6 | Bundle creep from Radix usage | Medium | Medium | Bundle budget in CI; one Radix primitive at a time, justified |
| R7 | Hydration mismatches from date formatting | Medium | High | Always pass ISO strings, format inside RSCs; never call `new Date()` in client effects without `useEffect` guard |
| R8 | SEO regression by moving away from MPA conventions | Low | High | Dynamic `sitemap.ts`, per-event metadata, ISR for static-feel URLs |
| R9 | Backend rate-limits us during build (`generateStaticParams` over many events) | Medium | Medium | Cap pre-rendered events at 200; rely on ISR for the rest |
| R10 | Vercel pricing surprises (image optimization metering) | Low | Medium | Pre-resize at backend CDN; pass `unoptimized` for already-optimized URLs; monitor usage weekly |

---

## 7. Appendix — file & folder layout

Target structure after Phase 6:

```
gotovo/
├── .github/
│   └── workflows/
│       ├── ci.yml                       # typecheck, lint, test, build, bundle-size
│       └── lighthouse.yml               # Lighthouse CI on PRs
├── .vscode/
│   └── settings.json                    # Biome as default formatter
├── messages/
│   ├── en.json
│   └── sr.json
├── public/
│   ├── manifest.webmanifest
│   ├── icon-{192,512}.png
│   ├── icon-{192,512}-maskable.png
│   ├── apple-touch-icon.png
│   ├── og-default.png
│   ├── robots.txt
│   └── sw.js                            # generated by Serwist
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx               # locale + theme providers, fonts
│   │   │   ├── page.tsx                 # feed (RSC)
│   │   │   ├── loading.tsx
│   │   │   ├── error.tsx
│   │   │   ├── not-found.tsx
│   │   │   ├── @modal/
│   │   │   │   ├── default.tsx          # null slot
│   │   │   │   └── (.)event/
│   │   │   │       └── [uid]/
│   │   │   │           └── page.tsx     # intercepted modal route
│   │   │   ├── event/
│   │   │   │   └── [uid]/
│   │   │   │       ├── page.tsx         # full-page detail (RSC)
│   │   │   │       ├── loading.tsx
│   │   │   │       └── not-found.tsx
│   │   │   ├── privacy/page.tsx
│   │   │   └── terms/page.tsx
│   │   ├── api/
│   │   │   └── revalidate/route.ts      # HMAC-verified webhook
│   │   ├── offline/page.tsx             # PWA offline shell
│   │   ├── sitemap.ts                   # dynamic, fed by API
│   │   ├── robots.ts
│   │   └── opengraph-image.tsx
│   ├── components/
│   │   ├── feed/
│   │   │   ├── feed.tsx
│   │   │   ├── event-card.tsx
│   │   │   ├── date-group.tsx
│   │   │   ├── empty-state.tsx
│   │   │   └── tab-bar.tsx
│   │   ├── filters/
│   │   │   ├── filter-zone.tsx
│   │   │   ├── chip.tsx
│   │   │   └── tag-picker.tsx           # when tag count > threshold
│   │   ├── detail/
│   │   │   ├── detail-page.tsx
│   │   │   ├── info-cell.tsx
│   │   │   ├── confidence-dots.tsx
│   │   │   └── action-bar.tsx
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── primitives/
│   │   │   ├── pill.tsx
│   │   │   └── icon-button.tsx
│   │   ├── providers/
│   │   │   ├── theme-provider.tsx
│   │   │   └── analytics-provider.tsx
│   │   └── error-boundary.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts                # typed fetcher
│   │   │   ├── schemas.ts               # Zod
│   │   │   ├── types.gen.ts             # generated from OpenAPI
│   │   │   ├── adapters.ts              # API → component props
│   │   │   ├── errors.ts                # ApiError, SchemaError
│   │   │   └── hmac.ts                  # for /api/revalidate
│   │   ├── analytics.ts                 # track() wrapper
│   │   ├── datetime.ts                  # Intl.DateTimeFormat helpers
│   │   ├── sort.ts                      # Intl.Collator helpers
│   │   ├── style-tokens.ts              # category → CSS variable map
│   │   ├── url.ts                       # nuqs schemas
│   │   ├── env.ts                       # Zod env validator
│   │   └── cn.ts                        # className util
│   ├── styles/
│   │   └── globals.css                  # tokens + Tailwind
│   ├── i18n/
│   │   ├── config.ts                    # locales array
│   │   ├── routing.ts                   # next-intl routing
│   │   └── request.ts                   # message loader
│   ├── hooks/
│   │   ├── use-event-card-hover.ts
│   │   └── use-pwa-update.ts
│   └── middleware.ts                    # locale detection + revalidate auth
├── tests/
│   ├── unit/                            # vitest, mirrors src/
│   ├── integration/                     # vitest + msw
│   └── e2e/                             # playwright
│       ├── feed.spec.ts
│       ├── detail.spec.ts
│       ├── deep-link.spec.ts
│       └── a11y.spec.ts
├── __fixtures__/
│   └── events.ts                        # mock data for tests
├── docs/
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── CONTRIBUTING.md
│   └── DEPLOY.md
├── .nvmrc
├── biome.json
├── next.config.mjs
├── package.json
├── playwright.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── .env.example
└── pnpm-lock.yaml
```

### Files to delete from current `uploads/` scaffold

- `app/globals-a516bc8a.css` (duplicate of `app/globals.css`)
- `app/layout-5844ac76.tsx` (duplicate)
- `app/page-f439940e.tsx` (duplicate)
- `lib/data-6f074227.ts`, `lib/event-utils-89d925b4.ts`, `lib/types-4feb8e99.ts`, `lib/utils-e4642953.ts` (duplicates)
- `components/icons-499535dc.tsx` and most `components/icons.tsx` content — migrate callsites to `lucide-react`
- `components/theme-provider-7c1edcfa.tsx` (duplicate)
- `hooks/use-mobile-1b43441b.ts`, `hooks/use-toast-3b5f8c9c.ts` (duplicates; also evaluate if `use-toast` is needed in v1 — `sonner` is installed)
- `components.json` / `components-06076264.json` (shadcn config — not needed if not using shadcn)
- `postcss.config-54b5708e.mjs`, `next.config-dae4df4b.mjs`, `pnpm-lock-6632bae4.yaml`, `tsconfig-9c43305b.json`, `package-8df1c5c2.json` (all duplicates)
- `styles/globals.css` if it's the v0 default (keep only `app/globals.css`)
- `lib/data.ts` once Phase 1 lands

### Files to add immediately (Phase 0)

- `biome.json`
- `.nvmrc`
- `.github/workflows/ci.yml`
- `vitest.config.ts`
- `playwright.config.ts`
- `src/lib/env.ts`
- `src/app/error.tsx`, `loading.tsx`, `not-found.tsx`
- `.env.example`

---

## Bottom line

The project has **good bones**: a clear visual direction, a clean component split, a strict type system, and a thoughtful design-token system. What it lacks is everything that makes a real product real — data fetching, URL state, routing, observability, i18n, PWA, tests, CI.

**The plan above closes that gap in six phases over ~6 engineer-weeks.** Each phase is independently shippable. Phase 0 is the only one that's truly non-negotiable; the others can be reordered if backend readiness or user demand shifts priorities.

The single biggest risk is **backend readiness** (R1, R2). The contract is signed but implementation parity must be verified before Phase 1 begins — otherwise the frontend stalls waiting for endpoints that don't behave per spec. The mitigation (MSW stub from the OpenAPI spec) is non-negotiable.

Everything else is execution.
