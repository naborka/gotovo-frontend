import { expect, test } from '@playwright/test';
import { openFeed } from './helpers';

test('feed loads with mocked events', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Gotovo/i);
  await expect(page.getByRole('link', { name: 'Mock Hike at Fruška Gora' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mock Jazz Night' })).toBeVisible();
});

test('feed loads in en locale', async ({ page }) => {
  await openFeed(page, '/en');
});

test('rows show no description snippet or tags', async ({ page }) => {
  await openFeed(page, '/en');
  await expect(page.getByText('Test event #1 (HIKING).')).toHaveCount(0);
  await expect(page.getByText('#Outdoor')).toHaveCount(0);
});
