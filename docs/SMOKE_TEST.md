# Production smoke-test playbook

Copy this checklist into a release issue. Every item is a clear pass/fail in under 60 seconds. Skip nothing. If something near-misses production, add the check that would have caught it.

## 1. Pre-deploy

- [ ] `main` is green on CI (unit, e2e, a11y, Lighthouse, bundle-size).
- [ ] `pnpm build` clean locally; no warnings.
- [ ] Env vars confirmed in Vercel project settings: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SEARCH_ENABLED`.
- [ ] Backend health endpoint returns 200 from production network.

## 2. Post-deploy — automated paths

- [ ] Production URL responds 200 within 2 s.
- [ ] `/robots.txt` lists the sitemap URL.
- [ ] `/sitemap.xml` contains the expected event count (within 10% of the live event count from the backend `/v1/events?limit=1` total).
- [ ] `/manifest.webmanifest` returns the expected JSON.
- [ ] `/serwist/sw.js` 200 with cache buckets present.

## 3. Post-deploy — manual

- [ ] Feed loads in < 2 s (Network throttle: Fast 4G).
- [ ] Apply a filter → URL reflects state, list updates.
- [ ] Open an event → modal opens, content rendered.
- [ ] Reload from modal URL → full page renders with same content.
- [ ] Theme toggle persists across reload.
- [ ] Language switch (`/ru` ↔ `/en`) preserves filter state.
- [ ] Service worker registers (DevTools → Application → Service Workers → activated).
- [ ] Install prompt appears on Android Chrome after engagement.
- [ ] Add-to-home-screen on iOS Safari → icon matches `apple-touch-icon.png`.
- [ ] Airplane mode → offline shell renders within ~500 ms.

## 4. Third-party validators

- [ ] [Google Search Console](https://search.google.com/search-console) → Test live URL → "URL is on Google".
- [ ] [Twitter Card Validator](https://cards-dev.twitter.com/validator) → "Card loaded successfully" on event detail.
- [ ] [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) → no errors; correct OG image.
- [ ] [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) → image renders.
- [ ] [PageSpeed Insights](https://pagespeed.web.dev/) → mobile + desktop both ≥ 80 (informational; CI gates the hard threshold).

## 5. Post-launch monitoring (first 24 h)

- [ ] Vercel Analytics dashboard shows traffic, no error spike.
- [ ] Sentry (once #0050+ analytics ships) → no new error groups in the first hour.
- [ ] Manually share one event link on each major platform; verify card renders.
- [ ] Backend dashboard: request rate, error rate, p99 latency normal.

## 6. Rollback plan

If a critical regression is observed:

```
vercel rollback <previous-deploy-id>
```

Notify on-call channel. Investigate post-rollback.

## Notes

- This document evolves. When a near-miss happens, add the check that would have caught it.
- Don't pad with theatre — every item must produce a clear pass/fail in < 60 s of work.
- Section 5 (post-launch monitoring) overlaps with Phase 4 (skipped). Once Phase 4 lands, expand the Sentry checks.
