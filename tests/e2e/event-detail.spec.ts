import { expect, test } from '@playwright/test';
import { openFeed } from './helpers';

test('clicking an event row opens the intercepted modal', async ({ page }) => {
  await openFeed(page);

  // The dev service worker may reload the page right after first paint,
  // swallowing the click — retry until the navigation sticks.
  await expect(async () => {
    await page.getByRole('link', { name: /Mock Hike at Fruška Gora/i }).click();
    await page.waitForURL(/\/event\/evt-mock-01$/, { timeout: 3000 });
  }).toPass();

  // Modal route shows full content; verify title visible at h1 level.
  await expect(page.getByRole('heading', { name: /Mock Hike at Fruška Gora/i })).toBeVisible();
  await expect.poll(() => page.url()).toMatch(/\/event\/evt-mock-01$/);
});

test('direct visit to /event/{uid} renders the full page', async ({ page }) => {
  await page.goto('/event/evt-mock-02');
  await expect(page.getByRole('heading', { name: /Mock Jazz Night/i })).toBeVisible();
});

test('unknown uid renders 404 shell', async ({ page }) => {
  await page.goto('/event/does-not-exist', { waitUntil: 'domcontentloaded' });
  await expect(
    page.getByText(/Страница не найдена|Page not found|not found/i).first(),
  ).toBeVisible();
});
