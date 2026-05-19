import { expect, test } from '@playwright/test';

// SW only registers in production builds (disabled in dev). Gate on E2E_PROD.
test.skip(!process.env.E2E_PROD, 'PWA install requires E2E_PROD=1 (prod build)');

test('service worker registers and precache populates', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const swReady = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.ready;
    return Boolean(reg.active);
  });
  expect(swReady).toBe(true);

  const swUrl = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return reg?.active?.scriptURL ?? null;
  });
  expect(swUrl).toMatch(/\/serwist\/sw\.js$/);

  const cacheNames = await page.evaluate(() => caches.keys());
  expect(cacheNames.length).toBeGreaterThan(0);
});

test('manifest.webmanifest is reachable with PWA fields', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest');
  expect(res.ok()).toBe(true);
  const json = await res.json();
  expect(json.name).toBe('gotovo');
  expect(json.display).toBe('standalone');
  expect(Array.isArray(json.icons)).toBe(true);
  expect(json.icons.length).toBeGreaterThan(0);
});
