import { test, expect } from '@playwright/test';

test.describe('Application Shell Smoke Test', () => {
  test('should load application shell and render main title', async ({ page }) => {
    await page.goto('/');

    const title = page.locator('h1.site-title');
    await expect(title).toHaveText('PureQR');

    const tagline = page.locator('.site-tagline');
    await expect(tagline).toHaveText('Private. Reliable. Open Source.');
  });
});
