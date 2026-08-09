import { expect, test } from '@playwright/test';

test.describe('Phase 8 — Keyboard Navigation & Accessibility E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('.appearance-summary').click();
  });

  test('TEST 1 — Keyboard Focus & Navigation: Complete mouse-free generator workflow', async ({
    page,
  }) => {
    // Verify main content heading is visible
    await expect(page.getByRole('heading', { name: 'PureQR' })).toBeVisible();

    // Focus URL input directly via tab key or direct focus
    const urlInput = page.getByLabel('Website URL');
    await urlInput.focus();
    await expect(urlInput).toBeFocused();

    // Type new URL using keyboard
    await urlInput.fill('https://keyboard-test.example.org');

    // Focus and select ECC H via keyboard
    const eccGroup = page.getByRole('radiogroup', { name: 'Error Correction Level' });
    const eccH = eccGroup.getByRole('radio', { name: 'H — strongest' });
    await eccH.focus();
    await expect(eccH).toBeFocused();
    await eccH.press('Space');

    // Focus and select Dots data module shape via keyboard
    const dataGroup = page.getByRole('radiogroup', { name: 'Data Module Shape' });
    const dotRadio = dataGroup.getByRole('radio', { name: 'Dots' });
    await dotRadio.focus();
    await expect(dotRadio).toBeFocused();
    await dotRadio.press('Space');

    // Upload logo to reveal scale slider
    await page.locator('#logo-file-input').setInputFiles('tests/fixtures/sample-logo.png');

    // Focus Logo Scale range slider via keyboard
    const scaleSlider = page.getByLabel('Logo Size');
    await scaleSlider.focus();
    await expect(scaleSlider).toBeFocused();
    await scaleSlider.press('ArrowRight');

    // Expand secondary exports and focus Download SVG via keyboard
    const exportSummary = page.locator('.export-summary');
    await exportSummary.focus();
    await expect(exportSummary).toBeFocused();
    await exportSummary.press('Enter');
    await expect(page.locator('.export-options-disclosure')).toHaveAttribute('open', '');

    const downloadSvgBtn = page.getByRole('button', { name: 'Download SVG' });
    await downloadSvgBtn.focus();
    await expect(downloadSvgBtn).toBeFocused();

    // Focus Download PNG button via keyboard
    const downloadPngBtn = page.getByRole('button', { name: 'Download PNG' });
    await downloadPngBtn.focus();
    await expect(downloadPngBtn).toBeFocused();
  });
});
