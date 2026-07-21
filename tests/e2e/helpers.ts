import { expect, type Page } from '@playwright/test';

/** Opens a feed URL and waits until the first mock event row has rendered. */
export async function openFeed(page: Page, path = '/'): Promise<void> {
  await page.goto(path);
  await expect(page.getByRole('link', { name: 'Mock Hike at Fruška Gora' })).toBeVisible();
}
