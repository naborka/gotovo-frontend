# Gotovo Frontend — Technology Stack Analysis

> Backend exists. Vercel is the deployment target. This document focuses **exclusively** on the frontend, audits what the current design implies, and recommends a stack that matches the product — not a generic "Next.js best practices" listicle.

---

## 1. What the design tells me (and what it leaves unstated)

Reading the prototype critically:

| Signal in the code | What it implies for the stack |
| --- | --- |
| `EVENTS` is a hardcoded array, fetched nowhere | A data-fetching layer is missing — single biggest gap |
| Filter state in `useState` only | No deep links, no shareable filtered views, no back-button restoration |
| `DetailPage` is a sibling modal, not a route | Event URLs can't be shared — fatal for an event-discovery product |
| `REFERENCE_TIME` is a hardcoded constant | "New" badge will lie the moment this ships |
| `localStorage.setItem('gotovo-theme', …)` runs unguarded | Will throw during SSR; needs cookie or Next.js theme primitive |
| `document.body.classList.toggle('dark')` in effect | Causes hydration flash on first paint |
| No images, no `<picture>`, no `next/image` usage | Layout will fail the moment events have hero images |
| Serbian diacritics in mock data ("Fruška Gora") | i18n / locale-aware sort and format is real, not theoretical |
| `scrollbar-hidden` rows of 23+ tag chips | Filter UX won't scale past v1 — needs search/typeahead |

**Conclusion**: the current prototype is a good *visual* spec but a poor *production* skeleton. The stack must close those gaps without inflating bundle size or complexity.

---

## 2. Recommended frontend stack

### Core (non-negotiable)

- **Next.js 15, App Router** — already in use. RSC for the feed, client components only where state lives.
- **TypeScript strict + `noUncheckedIndexedAccess`** — codebase is already strict; tighten one notch further. `event.tags[0]` is currently typed `string` but could be `undefined`.
- **React 19** — comes with Next 15. Use `useActionState` and `useOptimistic` where they earn their keep (filter toggles, "save event"), nowhere else.
- **Tailwind v4** — keep. The `@theme inline` setup with CSS variables is the right pattern; don't regress to a JS-only tokens scheme.

### Data fetching — the missing piece

- **`fetch` in Server Components + `next: { revalidate: 600 }`** — backend serves JSON, the feed is identical for thousands of users, ISR is free. No SWR, no React Query for the **feed itself**.
- **TanStack Query** *only* if interactive operations are added (save, RSVP, optimistic upvote). Until then, YAGNI.
- **Zod** at the API boundary — validate the backend response before it hits React. Schema drift between frontend and backend is the #1 source of runtime crashes; catch it at the seam.
- **A typed API client** generated from the backend's OpenAPI spec (if it has one) via `openapi-typescript`. If no spec, hand-write a thin `lib/api.ts` with one function per endpoint. Do **not** scatter `fetch()` calls across components.

### State & URL

- **`nuqs`** — URL-synced search params with type safety. Replaces `useState` for `activeCategory`, `activeCity`, `activeTags`. Three benefits, all critical:
  1. Filter state survives reload
  2. Filtered views are shareable (`?cat=Music&city=Novi+Sad`)
  3. Back button works as users expect
- **No Redux, no Zustand, no Jotai.** All state is either URL-derivable or component-local.

### Routing

- **Detail view must be a real route** (`/event/[uid]`) with intercepted parallel routes for the modal-over-feed pattern. Next.js's `@modal` slot is built for exactly this. Result: same UX, but `/event/3` works when pasted into Slack.
- **`generateStaticParams` for all events at build time** — backend is the source of truth, this gives SEO + instant loads.

### Theme

- **`next-themes`** — handles SSR-safe theme detection, the FOUC class on `<html>`, system preference, cookie persistence. Throw away the current `localStorage` + `useEffect` toggle; it has a hydration mismatch waiting to happen.

### Fonts

- **`next/font/google`** for DM Sans, DM Mono, Syne — self-hosted, zero CLS, no `<link>` to Google's CDN. Already best practice; just wire it up via the `--font-*` variables the CSS already expects.

### Icons

- **`lucide-react`** — replaces the hand-rolled `icons.tsx`. Same look, tree-shaken, ~250 bytes per icon. Keep `LogoMark` hand-rolled (it's brand).

### Images (when they arrive)

- **`next/image`** with `remotePatterns` allowlisting the backend CDN. Don't even consider `<img>`; mobile data plans punish unoptimized photos.
- **Blur placeholders** via the backend (return an 8×8 base64 alongside each event) or `plaiceholder` at build time.

### i18n

- **`next-intl`** — file-based message catalogs, RSC-compatible. Set up the scaffolding now even if shipping English-only — the cost of retrofitting i18n later is 10× the cost of installing it on day one. Two locales: `en`, `sr`.
- Use `Intl.DateTimeFormat` for dates instead of the current `WEEK_DAYS`/`MONTHS` arrays. Replaces a custom formatter with the platform's correct one for free.

### Forms (when they exist — newsletter, submit-event, save)

- **`react-hook-form` + `zod` (with `@hookform/resolvers/zod`)** — same Zod schema validates the form client-side and the action server-side. DRY across the wire.
- **Server Actions** for mutations. No `/api/submit-event` route handler unless a non-browser client needs it.

### PWA

- **`@serwist/next`** (not the abandoned `next-pwa`). Manifest + icons + a minimal service worker for offline shell. Gotovo lives on phones; an install prompt is the cheapest retention feature available.

### Analytics & errors

- **Vercel Analytics + Speed Insights** — one-line install, no cookie banner if you stay on the basic plan, real Core Web Vitals from real users.
- **Sentry (`@sentry/nextjs`)** with `tunnelRoute` to dodge ad-blockers.
- **PostHog** *only* if funnels/session replay are actually needed. Otherwise it's 50KB of JS for nothing.

### Quality

- **Biome** — one binary, replaces ESLint + Prettier, 50× faster. Reject the old ESLint + Prettier + 14 plugins config.
- **Vitest** for the pure functions (`filterEvents`, `groupEventsByDate`, `isNewEvent`). These are literal textbook unit-test targets.
- **Playwright** for two flows: "open feed, apply filter, open detail" and "share a deep link, land on detail". Don't write 50 E2E tests; write the two that catch real regressions.
- **`@axe-core/playwright`** in the E2E suite — accessibility regressions are silent killers.

### CI/CD

- GitHub Actions: `biome ci`, `tsc --noEmit`, `vitest run`, `playwright test`. Vercel handles deploys via Git integration. Don't write a `deploy.yml`.

---

## 3. What to REJECT (the YAGNI list)

| Tempting choice | Why reject |
| --- | --- |
| **shadcn/ui** | The custom `Pill`/`Chip`/`InfoCell` are 30 lines each and do exactly what's needed. Adopting shadcn means adopting Radix — 40KB+ of primitives for a feed app. Add one Radix primitive at a time when (and only when) a real combobox or focus-trapped dialog is needed. |
| **Framer Motion** | The animations here are four CSS transitions. Framer is 50KB. CSS does this for zero. |
| **Storybook** | Two atomic components (Pill, Chip). Storybook costs more to maintain than the components themselves. |
| **MDX / contentlayer** | No editorial content. |
| **React Native / Expo** | A well-built PWA covers 95% of the use case. Revisit if Apple Pay or push-on-iOS becomes critical. |
| **A second design tool layer** (Stitches, vanilla-extract, Panda CSS) | Tailwind v4 + CSS variables already solves theming. |
| **Redux DevTools, MobX, XState** | Three filter chips and a modal are not a state machine. |
| **next-auth in v1** | No feature requires identity yet. |

---

## 4. Concrete refactor sequence (priority order)

If taking ownership of this codebase tomorrow:

1. **Replace `lib/data.ts` with a real fetcher.** Server component reads from backend with `revalidate: 600`. Zod-validate the response. *This is the single highest-leverage change.*
2. **Move filters to `nuqs`.** Delete `useState` for `activeCategory` / `activeCity` / `activeTags`. Filtered URLs become shareable for free.
3. **Make detail a route + intercepted modal.** `/event/[uid]` with `@modal/(.)event/[uid]`. Same UX, real URLs.
4. **Wire up `next-themes`.** Kill the hydration flash and the unsafe `localStorage` access.
5. **Swap fonts to `next/font/google`.** Zero CLS.
6. **Replace hand-rolled icons with `lucide-react`.** Smaller bundle, less maintenance.
7. **Add `next-intl`** scaffolding (even if only `en` for now).
8. **Set up Vitest** and port the existing pure-function logic to tests *before* refactoring it further.
9. **Add Sentry + Vercel Analytics.**
10. **Add PWA manifest + Serwist.** Last, because shipping value beats installability.

Each step ships independently, none requires backend changes, all are reversible.

---

## 5. Critical frontend-specific risks

1. **Hydration flashes** from theme + locale + date formatting. Solve once via `next-themes` + `next-intl` + ISO date strings over the wire (never `Date` objects in JSON).
2. **The "New" badge will lie** the moment `REFERENCE_TIME` ships to prod. Compute freshness on the server, send a boolean, or compute on the client with a `useEffect` that updates after mount (accept the flicker).
3. **Filter chip overflow** on mobile — 23 tags scrolls horizontally now, but at 80+ tags users will never find a specific one. Plan a `<TagPicker>` with search before tag count grows.
4. **Image-less cards look great until they have images** — the current layout doesn't reserve space. Decide now whether cards are text-only forever, or design the image slot before backend starts attaching them.
5. **Serbian sort order** — `'Žabac' < 'Apple'` in default `localeCompare` unless `'sr'` is passed. The current `ALL_CITIES.sort()` is already wrong for Serbian city names. Fix at the source.
6. **Bundle creep** — set a CI budget. `@next/bundle-analyzer` in CI, fail the build if first-load JS exceeds, say, 120KB. Discipline prevents drift.

---

## 6. Vercel-specific notes

- **ISR + on-demand revalidation.** Backend can `POST /api/revalidate` (with a secret) when new events land, triggering an instant re-render of affected pages. Combine with `revalidate: 600` as a safety net.
- **Edge runtime is *not* a default.** Use it only for read-only endpoints with no Node-specific deps. The feed RSC stays Node — full ecosystem, no surprises.
- **Image optimization is metered.** Cache aggressively (`minimumCacheTTL: 86400`), pick `formats: ['image/avif', 'image/webp']`, set `deviceSizes` to match real breakpoints (don't ship the default array — it's wider than needed).
- **`output: 'standalone'` is irrelevant on Vercel** — that's for self-hosting. Don't enable it.
- **Preview deployments per PR** — turn this into a review tool. Comment the URL on PRs automatically (built into Vercel's GitHub app).
- **Environment variables**: `NEXT_PUBLIC_*` for anything the browser needs (analytics keys, API base URL); everything else stays server-only and is leak-proof.
- **Functions region** — set to `fra1` (Frankfurt) or `arn1` (Stockholm) to minimize latency to the Belgrade/Novi Sad audience and (likely) the backend.

---

## Bottom line

**Stack**: Next.js 15 (App Router, RSC) + TypeScript strict + Tailwind v4 + Zod + `nuqs` + `next-themes` + `next-intl` + `next/font` + `lucide-react` + `next/image` + Serwist (PWA) + Vercel Analytics + Sentry + Biome + Vitest + Playwright.

**The point**: every item on that list closes a *specific gap* visible in the current code. Nothing is there because it's fashionable. Anything not on the list — including everything in Section 3 — is rejected until a user pain proves otherwise.

The frontend shown here is 70% of the way there visually and 30% of the way there architecturally. The list above closes that gap without growing the surface area to maintain.
