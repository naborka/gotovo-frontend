import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { openFeed } from './helpers';

const allowlist = JSON.parse(
  readFileSync(join(process.cwd(), 'tests/e2e/a11y-allowlist.json'), 'utf8'),
) as Record<string, string[]>;

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function analyzeWithRetry(page: Page, include?: string) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const builder = new AxeBuilder({ page }).withTags(TAGS);
      if (include) builder.include(include);
      return await builder.analyze();
    } catch (error) {
      // The dev service worker reloads the page once on first install;
      // retry when that navigation lands mid-scan.
      const retryable =
        String(error).includes('Execution context was destroyed') ||
        String(error).includes("reading 'documentElement'");
      if (attempt >= 2 || !retryable) throw error;
      await page.waitForLoadState('load');
    }
  }
}

async function scan(page: Page, path: string, include?: string) {
  const results = await analyzeWithRetry(page, include);
  const allowed = new Set(allowlist[path] ?? []);
  const blocking = results.violations.filter(
    (v) => (v.impact === 'serious' || v.impact === 'critical') && !allowed.has(v.id),
  );
  const report = blocking.map((v) => `${v.id} (${v.impact}): ${v.help}`).join('\n');
  expect(blocking, report).toEqual([]);
}

test('a11y — feed (ru)', async ({ page }) => {
  await openFeed(page);
  await scan(page, '/');
});

test('a11y — feed (en)', async ({ page }) => {
  await openFeed(page, '/en');
  await scan(page, '/en');
});

test('a11y — event detail full page', async ({ page }) => {
  await page.goto('/event/evt-mock-01');
  await expect(page.getByRole('heading', { name: /Mock Hike/ })).toBeVisible();
  await scan(page, '/event/evt-mock-01');
});
