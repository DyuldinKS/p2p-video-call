import { test, expect } from '@playwright/test';

test('start call generates and shows an offer', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Start a call' }).click();

  const offerTextarea = page
    .locator('span', { hasText: 'Your offer' })
    .locator('..')
    .locator('textarea');

  await expect(offerTextarea).not.toBeEmpty({ timeout: 15_000 });
});
