import { expect, test } from '@playwright/test';

test('drag on anchor week day grid creates an event', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: /week schedule/i })).toBeVisible();

  const cell = page.getByRole('region', { name: /week schedule/i }).locator('.day-grid-interaction').nth(7);
  await cell.scrollIntoViewIfNeeded();
  await expect(cell).toBeVisible();

  const blocks = page.locator('.week-event-block');
  const nBefore = await blocks.count();

  const box = await cell.boundingBox();
  expect(box).toBeTruthy();
  const x = box!.x + box!.width / 2;
  const y1 = box!.y + 100;
  const y2 = box!.y + 260;

  await page.mouse.move(x, y1);
  await page.mouse.down();
  await page.mouse.move(x, y2, { steps: 25 });
  await page.mouse.up();

  await expect(blocks).toHaveCount(nBefore + 1, { timeout: 15_000 });
  await expect(page.getByText('New event').first()).toBeVisible();
});
