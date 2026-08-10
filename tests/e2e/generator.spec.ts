import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Phase 4 — Generator UI E2E & Accessibility Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TEST 1 — URL: Generates QR SVG preview and metadata for valid URL', async ({ page }) => {
    const urlInput = page.getByLabel('Website URL');
    await expect(urlInput).toBeVisible();

    await urlInput.fill('https://example.com/test');

    const previewWrapper = page.getByLabel('Generated QR Code Preview');
    await expect(previewWrapper).toBeVisible();
    await expect(previewWrapper.locator('svg')).toBeVisible();

    const metadata = page.getByLabel('QR Code Specifications');
    await expect(metadata).toBeVisible();
    await expect(metadata).toContainText('Version');
    await expect(metadata).toContainText('modules');
  });

  test('TEST 1A — Initial URL state: Starts empty and uses a placeholder without an empty error', async ({
    page,
  }) => {
    const urlInput = page.getByLabel('Website URL');

    await expect(urlInput).toHaveValue('');
    await expect(urlInput).toHaveAttribute('placeholder', 'https://example.com');
    await expect(page.getByRole('alert')).not.toBeVisible();
    await expect(page.getByText('Your QR will appear here')).toBeVisible();
  });

  test('TEST 2 — Invalid URL: Shows validation error and replaces QR preview with placeholder', async ({
    page,
  }) => {
    const urlInput = page.getByLabel('Website URL');
    await urlInput.fill('javascript:alert(1)');

    const errorMsg = page.getByRole('alert');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('http: and https: are supported');

    await expect(page.getByLabel('Generated QR Code Preview')).not.toBeVisible();
    await expect(page.getByText('Your QR will appear here')).toBeVisible();
  });

  test('TEST 3 — Wi-Fi: Generates QR preview for WPA Wi-Fi network', async ({ page }) => {
    // Switch to Wi-Fi payload type
    await page.getByLabel('QR type').selectOption('wifi');

    await page.getByLabel('Network Name (SSID)').fill('QRVerity Network');
    await page.getByLabel('Security Type').selectOption('WPA');
    await page.getByLabel('Password').fill('correct horse battery staple');

    const previewWrapper = page.getByLabel('Generated QR Code Preview');
    await expect(previewWrapper).toBeVisible();
    await expect(previewWrapper.locator('svg')).toBeVisible();
  });

  test('TEST 4 — Payload Switching: Switches cleanly across multiple forms', async ({ page }) => {
    const payloadSelect = page.getByLabel('QR type');

    // Switch to Text
    await payloadSelect.selectOption('text');
    await expect(page.getByLabel('Plain Text')).toBeVisible();

    // Switch to Contact
    await payloadSelect.selectOption('vcard');
    await expect(page.getByLabel('First Name')).toBeVisible();
    await expect(page.getByLabel('Job Title')).toBeVisible();

    // Switch to Location
    await payloadSelect.selectOption('geo');
    await expect(page.getByLabel('Latitude (-90 to 90)')).toBeVisible();

    // Switch to Calendar
    await payloadSelect.selectOption('calendar');
    await expect(page.getByLabel('Event Title')).toBeVisible();
  });

  test('TEST 5 — Mobile Viewport: Renders without horizontal scroll on 390x844', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Your QR will appear here')).toBeVisible();

    const isScrollableX = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(isScrollableX).toBe(false);
  });

  test('TEST 5A — Narrow Mobile Viewport: Renders without horizontal scroll on 320x568', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });

    const isScrollableX = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(isScrollableX).toBe(false);
  });

  test('TEST 6 — Accessibility: Passes Axe audit across states with zero critical/serious violations', async ({
    page,
  }) => {
    const scanAxe = async () => {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const criticalOrSerious = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalOrSerious).toEqual([]);
    };

    const payloadSelect = page.getByLabel('QR type');

    // 1. URL State
    await scanAxe();

    // 2. Wi-Fi State
    await payloadSelect.selectOption('wifi');
    await scanAxe();

    // 3. Contact State
    await payloadSelect.selectOption('vcard');
    await scanAxe();

    // 4. Calendar State
    await payloadSelect.selectOption('calendar');
    await scanAxe();

    // 5. Invalid State
    await payloadSelect.selectOption('url');
    await page.getByLabel('Website URL').fill('javascript:bad');
    await scanAxe();
  });

  test('TEST 7 — Privacy: Ensures payload content is never transmitted in outbound network requests', async ({
    page,
  }) => {
    const distinctivePayload = 'https://privacy-check-distinctive-token-998877.example.com';
    const capturedUrls: string[] = [];
    const capturedBodies: string[] = [];

    page.on('request', (req) => {
      capturedUrls.push(req.url());
      const postData = req.postData();
      if (postData) {
        capturedBodies.push(postData);
      }
    });

    const urlInput = page.getByLabel('Website URL');
    await urlInput.fill(distinctivePayload);

    await expect(page.getByLabel('Generated QR Code Preview')).toBeVisible();

    // Verify distinctive payload NEVER appears in any network request URL or body
    for (const reqUrl of capturedUrls) {
      expect(reqUrl).not.toContain('privacy-check-distinctive-token');
    }
    for (const body of capturedBodies) {
      expect(body).not.toContain('privacy-check-distinctive-token');
    }
  });
});
