import { expect, test } from '@playwright/test';

// Share-link copy handler is not yet wired (button is presentational).
// Verify the affordance exists at the expected accessibility level so a
// future implementation has a stable selector to bind to.
test('share button is reachable on the detail view', async ({ page }) => {
  await page.goto('/event/evt-mock-01');
  await expect(page.getByRole('heading', { name: /Mock Hike at Fruška Gora/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Поделиться|Share/i })).toBeVisible();
});
