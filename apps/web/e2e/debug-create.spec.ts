import { expect, test } from '@playwright/test';

test('debug page increases event count when adding mock event', async ({ page }) => {
  await page.goto('/debug');
  const strong = page.locator('.debug-panel strong').first();
  const beforeText = await strong.textContent();
  const before = Number.parseInt(beforeText ?? '0', 10);

  await page.getByRole('button', { name: /add mock event/i }).click();

  await expect(async () => {
    const t = await strong.textContent();
    const n = Number.parseInt(t ?? '', 10);
    expect(n).toBeGreaterThan(before);
  }).toPass();
});
