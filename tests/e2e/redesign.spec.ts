import { expect, test } from '@playwright/test';
import { openFeed } from './helpers';

test('quick-jump strip scrolls the feed to the matching date group', async ({ page }) => {
  await openFeed(page, '/en');

  const jumpStrip = page.getByRole('button', { name: 'Tomorrow' });
  await expect(jumpStrip).toBeVisible();
  await expect(page.getByRole('button', { name: 'Today', exact: true })).toBeVisible();

  // Retry the click until hydration has attached the handler.
  await expect(async () => {
    await jumpStrip.click();
    const scrollTop = await page.locator('#feed-scroll').evaluate((el) => el.scrollTop);
    expect(scrollTop).toBeGreaterThan(0);
  }).toPass();
});

test('detail location links to Google Maps and opens in a new tab', async ({ page }) => {
  await page.goto('/en/event/evt-mock-01');
  const link = page.getByRole('link', { name: /Novi Sad, Fruška Gora/ });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute(
    'href',
    'https://maps.google.com/?q=Fru%C5%A1ka%20Gora%2C%20Novi%20Sad%2C%20Serbia',
  );
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
});

test('Add to calendar downloads an ICS file', async ({ page }) => {
  await page.goto('/en/event/evt-mock-01');
  const button = page.getByRole('button', { name: 'Add to calendar' });
  await expect(button).toBeVisible();
  // Retry until hydration has attached the click handler.
  let filename = '';
  await expect(async () => {
    const downloadPromise = page.waitForEvent('download', { timeout: 3000 });
    await button.click();
    filename = (await downloadPromise).suggestedFilename();
  }).toPass();
  expect(filename).toMatch(/\.ics$/);
});

test('detail shows no confidence cell or source-count dots', async ({ page }) => {
  await page.goto('/en/event/evt-mock-01');
  await expect(page.getByRole('heading', { name: /Mock Hike/ })).toBeVisible();
  await expect(page.getByText(/confidence/i)).toHaveCount(0);
  await expect(page.getByText(/\d+ sources?/i)).toHaveCount(0);
});

test('date group headers show relative labels', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { name: /^Today / })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Tomorrow / })).toBeVisible();
});
