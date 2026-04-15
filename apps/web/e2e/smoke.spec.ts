import { expect, test } from '@playwright/test';

test.describe('navigation smoke', () => {
  test('week view loads schedule region', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Week' })).toBeVisible();
    await expect(
      page.getByRole('region', { name: /week schedule/i }),
    ).toBeVisible();
  });

  test('day and month routes render', async ({ page }) => {
    await page.goto('/day');
    await expect(page.getByRole('heading', { level: 1, name: 'Day' })).toBeVisible();
    await page.goto('/month');
    await expect(page.getByRole('heading', { level: 1, name: 'Month' })).toBeVisible();
  });
});
