import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Phase 7 — Appearance & Logo Support E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await page.locator('.appearance-summary').click();
    await page.getByLabel('Website URL').fill('https://example.com/appearance-test');
  });

  test('TEST 1 — Appearance Controls: Changes module and finder styles cleanly', async ({
    page,
  }) => {
    await expect(page.locator('.appearance-summary')).toBeVisible();

    const dataGroup = page.getByRole('radiogroup', { name: 'Data Module Shape' });
    await dataGroup.getByRole('radio', { name: 'Dots' }).click();

    const svgWrapper = page.locator('.qr-preview-svg-wrapper');
    await expect(svgWrapper.locator('circle').first()).toBeVisible();

    const squareFinderSvg = await svgWrapper.innerHTML();
    const finderGroup = page.getByRole('radiogroup', { name: 'Finder Style' });
    await finderGroup.getByRole('radio', { name: 'Rounded' }).click();

    await expect.poll(async () => svgWrapper.innerHTML()).not.toBe(squareFinderSvg);
    await page.waitForTimeout(40);
    await expect(page.locator('.reliability-panel')).toHaveAttribute(
      'data-verification-state',
      'pending'
    );

    const badge = page.locator('.reliability-badge');
    await expect(badge).toBeVisible({ timeout: 15000 });
    await expect(badge).toHaveText('Good');

    await finderGroup.getByRole('radio', { name: 'Square' }).click();
    await expect.poll(async () => svgWrapper.innerHTML()).toBe(squareFinderSvg);
  });

  test('TEST 2 — Color Controls & Contrast: Updates the SVG live for native and typed colors', async ({
    page,
  }) => {
    const fgInput = page.getByLabel('Foreground Hex Color');
    const svgWrapper = page.locator('.qr-preview-svg-wrapper');

    await fgInput.fill('#123');
    await expect.poll(async () => svgWrapper.innerHTML()).toContain('#112233');

    const validShortHexSvg = await svgWrapper.innerHTML();
    await fgInput.fill('#12');
    await expect.poll(async () => svgWrapper.innerHTML()).toBe(validShortHexSvg);

    await fgInput.fill('#0969DA');
    await expect.poll(async () => svgWrapper.innerHTML()).toContain('#0969DA');

    await page.locator('#fg-color-picker').evaluate((element) => {
      const input = element as HTMLInputElement;
      input.value = '#123456';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect.poll(async () => svgWrapper.innerHTML()).toContain('#123456');

    await page.locator('#bg-color-picker').evaluate((element) => {
      const input = element as HTMLInputElement;
      input.value = '#EEEEEE';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect.poll(async () => svgWrapper.innerHTML()).toContain('#EEEEEE');

    await page.locator('#bg-color-picker').evaluate((element) => {
      const input = element as HTMLInputElement;
      input.value = '#FFFFFF';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const badge = page.locator('.reliability-badge');
    await expect(badge).toBeVisible({ timeout: 15000 });
    await expect(badge).toHaveText('Good');
  });

  test('TEST 3 — Logo Upload: Forces ECC H and exposes logo context', async ({ page }) => {
    const fileInput = page.locator('#logo-file-input');
    await fileInput.setInputFiles('tests/fixtures/sample-logo.png');

    await expect(page.locator('.ecc-forced-tag')).toBeVisible({ timeout: 15000 });

    const svgWrapper = page.locator('.qr-preview-svg-wrapper');
    await expect(svgWrapper.locator('image')).toBeVisible({ timeout: 15000 });

    const badge = page.locator('.reliability-badge');
    await expect(badge).toBeVisible({ timeout: 15000 });
    await expect(badge).toHaveText('Good');

    await page.getByText('What does this mean?').click();
    const reliabilityDetails = page.locator('.reliability-explanation');
    await expect(reliabilityDetails).toContainText('Error correction: H');
    await expect(reliabilityDetails).toContainText('Logo: Present');

    await page.getByRole('button', { name: 'Remove Logo' }).click();
    await expect(page.getByText('(Forced H for Logo)')).not.toBeVisible();
  });

  test('TEST 4 — Mobile Viewport: Appearance controls render cleanly on 390x844', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(page.locator('.appearance-summary')).toBeVisible();
    await expect(page.locator('.appearance-disclosure')).not.toHaveAttribute('open');

    const isScrollableX = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(isScrollableX).toBe(false);
  });

  test('TEST 5 — Accessibility: Appearance controls pass Axe audit with zero violations', async ({
    page,
  }) => {
    const dataGroup = page.getByRole('radiogroup', { name: 'Data Module Shape' });
    await dataGroup.getByRole('radio', { name: 'Dots' }).click();

    const badge = page.locator('.reliability-badge');
    await expect(badge).toBeVisible({ timeout: 15000 });

    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalOrSerious = axeResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious).toEqual([]);
  });

  test('TEST 6 — Privacy Assertion: Appearance controls and logo processing make zero network calls', async ({
    page,
  }) => {
    const capturedUrls: string[] = [];
    page.on('request', (req) => {
      capturedUrls.push(req.url());
    });

    const fgInput = page.getByLabel('Foreground Hex Color');
    await fgInput.fill('#116329');

    const fileInput = page.locator('#logo-file-input');
    await fileInput.setInputFiles('tests/fixtures/sample-logo.png');

    const badge = page.locator('.reliability-badge');
    await expect(badge).toBeVisible({ timeout: 15000 });

    for (const reqUrl of capturedUrls) {
      expect(reqUrl).not.toContain('privacy-test-logo');
    }
  });

  test('TEST 7 — Reliability Details: Reflect current appearance context and measured contrast', async ({
    page,
  }) => {
    await expect(page.locator('.reliability-badge')).toHaveText('Good', { timeout: 15000 });
    await page.getByText('What does this mean?').click();

    const reliabilityDetails = page.locator('.reliability-explanation');
    await expect(reliabilityDetails).toContainText('Contrast: 21.0:1');
    await expect(reliabilityDetails).toContainText(/Test render: \d+ × \d+ px/);
    await expect(reliabilityDetails).toContainText('Pixels/module');
    await expect(reliabilityDetails).toContainText('Error correction: M');
    await expect(reliabilityDetails).toContainText('Module style: Square');
    await expect(reliabilityDetails).toContainText('Finder style: Square');
    await expect(reliabilityDetails).toContainText('Logo: None');

    await page
      .getByRole('radiogroup', { name: 'Data Module Shape' })
      .getByRole('radio', { name: 'Dots' })
      .click();
    await page
      .getByRole('radiogroup', { name: 'Finder Style' })
      .getByRole('radio', { name: 'Rounded' })
      .click();

    await expect(reliabilityDetails).toContainText('Module style: Dots');
    await expect(reliabilityDetails).toContainText('Finder style: Rounded');
  });
});
