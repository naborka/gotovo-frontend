# Gotovo Frontend

Event discovery for Novi Sad and Belgrade. Next.js 16 App Router, React 19, Tailwind v4, next-intl. Talks to the Gotovo backend at `/v1/*` and ships as an installable PWA.

## Quickstart

```sh
# 1. Clone
git clone git@github.com:naborka/gotovo-frontend.git
cd gotovo-frontend

# 2. Install
nvm use            # .nvmrc → Node 22
corepack enable
pnpm install

# 3. Configure
cp .env.example .env.local
# edit NEXT_PUBLIC_API_BASE_URL to staging if no local backend

# 4. Run
pnpm dev           # http://localhost:3000
```

If you have no local backend, point `NEXT_PUBLIC_API_BASE_URL` at staging or run the mock API:

```sh
node tests/e2e/fixtures/api-server.mjs   # listens on :4000
# then set NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4000/v1
```

## Required tooling

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 22 (LTS) | Pinned via `.nvmrc` |
| pnpm | 9.x | Via `corepack enable` (managed by `packageManager` in `package.json`) |
| Git | any recent | |
| Chrome / Chromium | recent | Required for Playwright + Lighthouse CI |

macOS, Linux, and WSL2 all work. Native Windows untested.

## Environment variables

Source of truth: [`.env.example`](.env.example). Keep this table in sync.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | yes | `https://gotovo-api.duckdns.org/v1` | Backend base URL; must end at `/v1` |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://gotovo.app` | Canonical site URL used by manifest, sitemap, robots, OG metadata |
| `NEXT_PUBLIC_SEARCH_ENABLED` | no | `false` | Feature flag for full-text search UI (Decision 0006) |
| `REVALIDATE_SECRET` | yes (server) | – | HMAC signing key for `/api/revalidate` webhook |

`NEXT_PUBLIC_*` values are inlined at build time. Changing them requires a rebuild.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server (`next dev`, Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Run prod build locally |
| `pnpm lint` | Biome check |
| `pnpm lint:fix` | Biome check --write |
| `pnpm format` | Biome format --write |
| `pnpm test` | Vitest unit tests |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:coverage` | Vitest with coverage report |
| `pnpm e2e` | Playwright (incl. axe a11y gate) |
| `pnpm e2e:ui` | Playwright in UI mode |
| `pnpm e2e:install` | Install Playwright's bundled Chromium |
| `pnpm gen:api` | Regenerate `lib/api/types.gen.ts` from `lib/api/openapi.yaml` |

## Project layout

```
app/                # Next.js App Router routes (locale-prefixed)
  [locale]/         # Localized pages: feed, event detail, legal stubs
  api/              # Route handlers (revalidate webhook, etc.)
  manifest.webmanifest, robots, sitemap, opengraph-image
components/         # Shared React components
  gotovo/           # App-specific (header, footer, cards)
  ui/               # Primitives (shadcn-derived, do not edit unless noted)
hooks/              # Reusable client hooks
i18n/               # next-intl routing + request config
lib/                # Server-side helpers: api client, env, popular cache
messages/           # next-intl message catalogs (ru.json, en.json)
public/             # Static assets, icons, favicons
scripts/            # CI helpers (lhci-start, etc.)
tests/e2e/          # Playwright suites + mock API fixture
__fixtures__/       # Vitest fixtures
```

## Architecture pointers

- [`PROJECT_PLAN.md`](PROJECT_PLAN.md) — roadmap and decision log
- [`FRONTEND_STACK_ANALYSIS.md`](FRONTEND_STACK_ANALYSIS.md) — stack choices and trade-offs
- [`BACKEND_API_CONTRACT.md`](BACKEND_API_CONTRACT.md) — `/v1/*` contract this frontend consumes

## Testing

| Layer | Tool | Command | Gate |
| --- | --- | --- | --- |
| Unit | Vitest | `pnpm test` | CI: required |
| E2E | Playwright | `pnpm e2e` | CI: required |
| A11y | `@axe-core/playwright` | runs inside `pnpm e2e` | Zero serious/critical violations on critical pages |
| Perf / SEO / BP | Lighthouse CI | CI job `lighthouse` | Perf ≥ 0.9; a11y/BP/SEO ≥ 0.95 (event detail SEO ≥ 0.9 — see PR #78) |
| Bundle size | custom diagnostics | CI job `bundle-size` | First-load JS gate on `/[locale]` |

Run everything locally before pushing:

```sh
pnpm lint && pnpm tsc --noEmit && pnpm test && pnpm build
```

## Deploying

Vercel-first. Preview on every PR; production promotes from `main`.

```sh
vercel deploy             # preview
vercel deploy --prod      # production (only from main)
vercel rollback <id>      # emergency rollback
```

Required reading before any production deploy: [`docs/SMOKE_TEST.md`](docs/SMOKE_TEST.md).

## Releases

See the [smoke-test playbook](docs/SMOKE_TEST.md). Copy the checklist into a release issue, run it, ship.

## Contributing

- **Branch naming.** `feat/<id>-short-slug`, `fix/<short-slug>`, `chore/<id>-short-slug`, `docs/<short-slug>`.
- **Issue spec workflow.** Every non-trivial change starts as a spec file in `/issues/`. PR title references the id (e.g. `#0068`).
- **Commit style.** Conventional Commits: `feat(scope): …`, `fix(scope): …`, `docs: …`, `chore: …`, `test: …`, `refactor: …`. Body explains *why*. Wrap at ~72 chars.
- **PR conventions.** Title matches the leading commit. Body has `## Summary` + `## Test plan`. Squash-merge to keep `main` linear.
- **Generated files.** Do not hand-edit `lib/api/types.gen.ts`, `components/ui/*` (unless noted), or `messages/<lang>.json` outside the documented flow.

## Troubleshooting

1. **Service worker caches stale content in dev.** DevTools → Application → Service Workers → Unregister. The dev build disables Serwist (`disable: NODE_ENV === 'development'`), but a previously-installed prod build lingers across reloads.
2. **`/ru/...` returns 307.** `localePrefix: 'as-needed'`; the default locale strips its prefix. Always link via `Link` from `@/i18n/routing`, not `next/link`.
3. **Empty feed in dev.** `NEXT_PUBLIC_API_BASE_URL` mismatch. Check `.env.local`; if no local backend, point at staging or the mock API (`tests/e2e/fixtures/api-server.mjs`).
4. **Bundle-size gate failing.** Inspect `.next/diagnostics/route-bundle-stats.json` for the chunk that grew. Gate gzip-measures chunks under `firstLoadChunkPaths` for `/[locale]`.
5. **`next-intl` missing-key error.** Dev throws on undefined keys. Add the key to **both** `messages/ru.json` and `messages/en.json` before using it.

## License

See [LICENSE](LICENSE).
