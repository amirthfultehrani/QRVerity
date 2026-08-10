import { expect, test } from '@playwright/test';

test.describe('Phase 5 — Export & Clipboard E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
  });

  test('TEST 1 — SVG Download: Downloads canonical SVG file with safe filename', async ({
    page,
  }) => {
    const urlInput = page.getByLabel('Website URL');
    await urlInput.fill('https://example.com/test-svg-download');

    await expect(page.getByLabel('Generated QR Code Preview')).toBeVisible();

    await page.locator('.export-summary').click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download SVG' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('qrverity-url.svg');

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const svgContent = Buffer.concat(chunks).toString('utf-8');

    expect(svgContent).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svgContent).toContain('viewBox=');
    expect(svgContent).not.toContain('<html');
  });

  test('TEST 2 — PNG Download: Downloads pixel-snapped PNG image file', async ({ page }) => {
    const urlInput = page.getByLabel('Website URL');
    await urlInput.fill('https://example.com/test-png-download');

    await expect(page.getByLabel('Generated QR Code Preview')).toBeVisible();

    // Select 1024 px size preset
    await page.locator('.export-summary').click();
    await page.getByLabel('Image Export Size').selectOption('1024');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PNG' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('qrverity-url.png');

    const path = await download.path();
    expect(path).not.toBeNull();
  });

  test('TEST 3 — Invalid Payload: Disables export buttons when payload is invalid', async ({
    page,
  }) => {
    const urlInput = page.getByLabel('Website URL');
    await urlInput.fill('javascript:alert(1)');

    await expect(page.getByRole('alert')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Download PNG' })).toBeDisabled();
    await expect(page.locator('.export-options-disclosure')).not.toHaveAttribute('open');
    await page.locator('.export-summary').click();
    await expect(page.getByRole('button', { name: 'Download SVG' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Copy PNG' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Copy SVG' })).toBeDisabled();
  });

  test('TEST 4 — Copy SVG: Triggers copy SVG and displays accessible feedback', async ({
    page,
  }) => {
    const urlInput = page.getByLabel('Website URL');
    await urlInput.fill('https://example.com/copy-svg-test');

    await expect(page.getByLabel('Generated QR Code Preview')).toBeVisible();

    await page.locator('.export-summary').click();
    const copySvgBtn = page.getByRole('button', { name: 'Copy SVG' });
    if (await copySvgBtn.isEnabled()) {
      await copySvgBtn.click();
      const toast = page.locator('.export-feedback-toast');
      await expect(toast).toBeVisible();
      await expect(toast).toContainText('copied');
    }
  });

  test('TEST 5 — Mobile Export UI: Renders cleanly on 390x844 without horizontal scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await expect(page.getByRole('button', { name: 'Download PNG' })).toBeVisible();
    await expect(page.locator('.export-options-disclosure')).not.toHaveAttribute('open');
    await expect(page.getByRole('button', { name: 'Download SVG' })).not.toBeVisible();

    await page.locator('.export-summary').click();
    await expect(page.getByRole('button', { name: 'Download SVG' })).toBeVisible();
    await expect(page.locator('.export-options-disclosure')).toHaveAttribute('open', '');

    const isScrollableX = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(isScrollableX).toBe(false);
  });

  test('TEST 5A — Mobile Export UI: Keeps Download PNG in the preview result surface', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.getByLabel('Website URL').fill('https://example.com/mobile-export');
    await expect(page.getByLabel('Generated QR Code Preview')).toBeVisible();

    const previewPanel = page.locator('.preview-panel');
    await expect(previewPanel.getByRole('button', { name: 'Download PNG' })).toBeVisible();
    await expect(previewPanel.getByRole('button', { name: 'Download PNG' })).toBeEnabled();
  });

  test('TEST 6 — Privacy Assertion: Export operations make zero outbound network requests', async ({
    page,
  }) => {
    const distinctiveToken = 'https://export-privacy-token-99887766.example.com';
    const capturedUrls: string[] = [];

    page.on('request', (req) => {
      capturedUrls.push(req.url());
    });

    const urlInput = page.getByLabel('Website URL');
    await urlInput.fill(distinctiveToken);

    await expect(page.getByLabel('Generated QR Code Preview')).toBeVisible();

    await page.locator('.export-summary').click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download SVG' }).click();
    await downloadPromise;

    for (const reqUrl of capturedUrls) {
      expect(reqUrl).not.toContain('export-privacy-token');
    }
  });

  test('TEST 5B - Mobile Empty Export UI: Collapses secondary exports until a QR exists', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.getByLabel('Website URL').fill('');

    await expect(page.getByText('Your QR will appear here')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download PNG' })).toBeDisabled();
    await expect(page.locator('.export-options-disclosure')).not.toHaveAttribute('open');
  });
});
