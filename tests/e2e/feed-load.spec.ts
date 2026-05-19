import { expect, test } from '@playwright/test';

test('feed loads with mocked events', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Gotovo/i);
  await expect(page.getByRole('article').first()).toBeVisible();
  await expect(page.getByText('Mock Hike at Fruška Gora')).toBeVisible();
  await expect(page.getByText('Mock Jazz Night')).toBeVisible();
});

test('feed loads in en locale', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByText('Mock Hike at Fruška Gora')).toBeVisible();
});
