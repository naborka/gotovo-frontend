import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const allowlist = JSON.parse(
  readFileSync(join(process.cwd(), 'tests/e2e/a11y-allowlist.json'), 'utf8'),
) as Record<string, string[]>;

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function scan(page: Page, path: string, include?: string) {
  const builder = new AxeBuilder({ page }).withTags(TAGS);
  if (include) builder.include(include);
  const results = await builder.analyze();
  const allowed = new Set(allowlist[path] ?? []);
  const blocking = results.violations.filter(
    (v) => (v.impact === 'serious' || v.impact === 'critical') && !allowed.has(v.id),
  );
  const report = blocking.map((v) => `${v.id} (${v.impact}): ${v.help}`).join('\n');
  expect(blocking, report).toEqual([]);
}

test('a11y — feed (ru)', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await scan(page, '/');
});

test('a11y — feed (en)', async ({ page }) => {
  await page.goto('/en');
  await page.waitForLoadState('networkidle');
  await scan(page, '/en');
});

test('a11y — event detail full page', async ({ page }) => {
  await page.goto('/event/evt-mock-01');
  await page.waitForLoadState('networkidle');
  await scan(page, '/event/evt-mock-01');
});
