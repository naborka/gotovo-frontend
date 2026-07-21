import { expect, test } from '@playwright/test';
import { openFeed } from './helpers';

test('clicking a category chip updates URL with filter', async ({ page }) => {
  await openFeed(page, '/en');

  await page.getByRole('button', { name: 'Hiking', pressed: false }).click();

  await expect.poll(() => page.url()).toMatch(/[?&]category=HIKING/);
  await expect(page.getByRole('button', { name: 'Hiking', pressed: true })).toBeVisible();
});

test('category is multi-select and round-trips through the URL', async ({ page }) => {
  await openFeed(page, '/en');

  await page.getByRole('button', { name: 'Hiking', pressed: false }).click();
  await expect.poll(() => page.url()).toMatch(/category=HIKING/);
  await page.getByRole('button', { name: 'Party', pressed: false }).click();

  // nuqs serializes arrays as a comma-separated value.
  await expect.poll(() => decodeURIComponent(page.url())).toMatch(/category=HIKING,PARTY/);
  await expect(page.getByRole('link', { name: 'Mock Hike at Fruška Gora' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mock Jazz Night' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mock Workshop' })).toHaveCount(0);

  // Toggling one off narrows the URL back to a single value.
  await expect(async () => {
    await page.getByRole('button', { name: 'Party', pressed: true }).click();
    await page.waitForURL((url) => !url.search.includes('PARTY'), { timeout: 3000 });
  }).toPass();
  await expect.poll(() => page.url()).toMatch(/category=HIKING/);
});

test('a multi-select URL pre-activates both chips', async ({ page }) => {
  await page.goto('/en?category=HIKING,PARTY');
  await expect(page.getByRole('button', { name: 'Hiking', pressed: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Party', pressed: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mock Workshop' })).toHaveCount(0);
});

test('Clear resets filters and shows the count for multiple filters', async ({ page }) => {
  await page.goto('/en?category=HIKING,PARTY');
  await page.getByRole('button', { name: 'Clear (2)' }).click();
  await expect.poll(() => page.url()).not.toMatch(/category=/);
  await expect(page.getByRole('link', { name: 'Mock Workshop' })).toBeVisible();
});
