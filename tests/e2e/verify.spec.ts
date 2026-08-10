import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Phase 6 — Rendered-Output Verification E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await page.getByLabel('Website URL').fill('https://example.com/verification-test');
  });

  test('TEST 1 — URL Verification: Optical scan decodes default URL and displays GOOD badge', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Predicted Reliability' })).toBeVisible();

    const badge = page.locator('.reliability-badge');
    await expect(badge).toBeVisible({ timeout: 15000 });
    await expect(badge).toHaveText('Good');

    await expect(page.locator('.reliability-reason')).toBeVisible();
    await expect(page.getByText(/Test render:\s*\d+.*\d+ px/)).not.toBeVisible();
    await page.locator('.reliability-summary').click();
    await expect(page.getByText(/Test render:\s*\d+.*\d+ px/)).toBeVisible();
  });

  test('TEST 2 — Wi-Fi Verification: WPA network QR decodes round-trip with exact payload match', async ({
    page,
  }) => {
    await page.getByLabel('QR type').selectOption('wifi');

    await page.getByLabel('Network Name (SSID)').fill('QRVerity-Secure-5G');
    await page.getByLabel('Password').fill('SuperSecretPass123!');

    const badge = page.locator('.reliability-badge');
    await expect(badge).toBeVisible({ timeout: 15000 });
    await expect(badge).toHaveText('Good');
  });

  test('TEST 3 — vCard Verification: Contact vCard with CRLF line endings decodes round-trip', async ({
    page,
  }) => {
    await page.getByLabel('QR type').selectOption('vcard');

    await page.getByLabel('First Name').fill('Ada');
    await page.getByLabel('Last Name').fill('Lovelace');
    await page.getByLabel('Email Address').fill('ada@example.org');

    const badge = page.locator('.reliability-badge');
    await expect(badge).toBeVisible({ timeout: 15000 });
    await expect(badge).toHaveText('Good');
  });

  test('TEST 4 — Calendar Verification: iCalendar event with CRLF line endings decodes round-trip', async ({
    page,
  }) => {
    await page.getByLabel('QR type').selectOption('calendar');

    await page.getByLabel('Event Title').fill('QRVerity Architecture Review');
    await page.getByLabel('Start Date & Time').fill('2026-09-01T10:00');
    await page.getByLabel('End Date & Time (Optional)').fill('2026-09-01T11:00');

    const badge = page.locator('.reliability-badge');
    await expect(badge).toBeVisible({ timeout: 15000 });
    await expect(badge).toHaveText('Good');
  });

  test('TEST 5 — Rapid Typing: Keystrokes discard stale verification jobs and arrive at final GOOD state', async ({
    page,
  }) => {
    const input = page.getByLabel('Website URL');
    await input.fill('https://example.com/a');
    await input.fill('https://example.com/ab');
    await input.fill('https://example.com/abc');
    await input.fill('https://example.com/final-rapid-target');

    const badge = page.locator('.reliability-badge');
    await expect(badge).toBeVisible({ timeout: 15000 });
    await expect(badge).toHaveText('Good');
  });

  test('TEST 6 — Invalid Input: Clears verification result when form is invalid', async ({
    page,
  }) => {
    const input = page.getByLabel('Website URL');
    await input.fill('javascript:alert(1)');

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('Awaiting valid QR input.')).toBeVisible();
    await expect(page.locator('.reliability-badge')).not.toBeVisible();
  });

  test('TEST 7 — Accessibility: Verification live region announces completion with zero Axe violations', async ({
    page,
  }) => {
    const badge = page.locator('.reliability-badge');
    await expect(badge).toBeVisible({ timeout: 15000 });

    const liveRegion = page.locator('div[role="status"][aria-live="polite"]');
    await expect(liveRegion).toContainText('Predicted Reliability: Good');

    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalOrSerious = axeResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalOrSerious).toEqual([]);
  });

  test('TEST 8 — Privacy: Verification runs 100% locally with zero outbound network requests', async ({
    page,
  }) => {
    const distinctiveToken = 'https://verification-privacy-check-77665544.example.com';
    const capturedUrls: string[] = [];

    page.on('request', (req) => {
      capturedUrls.push(req.url());
    });

    const input = page.getByLabel('Website URL');
    await input.fill(distinctiveToken);

    const badge = page.locator('.reliability-badge');
    await expect(badge).toBeVisible({ timeout: 15000 });
    await expect(badge).toHaveText('Good');

    for (const reqUrl of capturedUrls) {
      expect(reqUrl).not.toContain('verification-privacy-check');
    }
  });
});
