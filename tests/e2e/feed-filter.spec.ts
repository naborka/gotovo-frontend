import { expect, test } from '@playwright/test';

test('clicking a category chip updates URL with filter', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('article').first()).toBeVisible();

  // Click any visible category chip; nuqs writes ?category=...
  const chip = page
    .getByRole('button', { pressed: false })
    .filter({ hasText: /HIKING|PARTY|WORKSHOP|Походы|Вечеринки/i })
    .first();
  await chip.click();

  await expect.poll(() => page.url()).toMatch(/[?&]category=/);
});
