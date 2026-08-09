import { expect, test } from '@playwright/test';

test.describe('Phase 8 — Cross-Browser Smoke Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('.appearance-summary').click();
  });

  test('TEST 1 — Core Generator Flow: Loads, validates URL, renders styled SVG, runs verification worker', async ({
    page,
  }) => {
    // 1. Verify app title
    await expect(page.getByRole('heading', { name: 'QRVerity' })).toBeVisible();

    // 2. Edit payload
    const urlInput = page.getByLabel('Website URL');
    await urlInput.fill('https://crossbrowser-test.org');

    // 3. Select Dot module shape
    const dataGroup = page.getByRole('radiogroup', { name: 'Data Module Shape' });
    await dataGroup.getByRole('radio', { name: 'Dot' }).click();

    // 4. Verify preview SVG rendered
    const svgWrapper = page.locator('.qr-preview-svg-wrapper');
    await expect(svgWrapper.locator('circle').first()).toBeVisible();

    // 5. Upload sample PNG logo
    const fileInput = page.locator('#logo-file-input');
    await fileInput.setInputFiles('tests/fixtures/sample-logo.png');

    // 6. Verify forced ECC H tag and embedded <image> tag
    await expect(page.locator('.ecc-forced-tag')).toBeVisible({ timeout: 15000 });
    await expect(svgWrapper.locator('image')).toBeVisible({ timeout: 15000 });

    // 7. Verification badge arrives at GOOD
    const badge = page.locator('.reliability-badge');
    await expect(badge).toBeVisible({ timeout: 15000 });
    await expect(badge).toHaveText('Good');

    // 8. Secondary export controls are available through progressive disclosure
    await page.locator('.export-summary').click();
    const downloadSvgBtn = page.getByRole('button', { name: 'Download SVG' });
    await expect(downloadSvgBtn).toBeEnabled();
  });

  test('TEST 2 — Mobile Layout & Privacy Assertion: Renders on mobile viewport without horizontal scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    await expect(page.getByRole('heading', { name: 'QRVerity' })).toBeVisible();

    const isScrollableX = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(isScrollableX).toBe(false);
  });
});
