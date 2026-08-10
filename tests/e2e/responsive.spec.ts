import { expect, Page, test } from '@playwright/test';

interface ViewportCase {
  width: number;
  height: number;
}

const MOBILE_VIEWPORTS: ViewportCase[] = [
  { width: 390, height: 844 },
  { width: 375, height: 812 },
  { width: 320, height: 568 },
];

async function expectNoHorizontalOverflow(page: Page, state: string) {
  const measurement = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(
    measurement.scrollWidth,
    `${state}: scrollWidth ${measurement.scrollWidth}px exceeded innerWidth ${measurement.innerWidth}px`
  ).toBeLessThanOrEqual(measurement.innerWidth);
}

test.describe('Responsive density and overflow regression suite', () => {
  for (const viewport of MOBILE_VIEWPORTS) {
    test(`${viewport.width}px remains horizontally contained in empty, valid, and expanded states`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');

      const urlInput = page.getByLabel('Website URL');

      await urlInput.fill('');
      await expect(page.getByText('Your QR will appear here')).toBeVisible();
      await expectNoHorizontalOverflow(page, `${viewport.width}px empty`);

      await urlInput.fill(`https://example.com/responsive-${viewport.width}`);
      await expect(page.locator('.reliability-badge')).toHaveText('Good', { timeout: 15000 });
      await expectNoHorizontalOverflow(page, `${viewport.width}px valid GOOD`);

      const disclosureBox = await page.locator('.reliability-disclosure').boundingBox();
      const summaryBox = await page.locator('.reliability-summary').boundingBox();
      expect(disclosureBox).not.toBeNull();
      expect(summaryBox).not.toBeNull();
      expect(summaryBox!.height).toBeGreaterThanOrEqual(44);
      expect(
        Math.abs(
          summaryBox!.x + summaryBox!.width / 2 - (disclosureBox!.x + disclosureBox!.width / 2)
        )
      ).toBeLessThanOrEqual(1);

      await page.locator('.appearance-summary').click();
      await expect(page.locator('.appearance-disclosure')).toHaveAttribute('open', '');
      await expectNoHorizontalOverflow(page, `${viewport.width}px Appearance expanded`);

      await page.locator('.reliability-summary').click();
      await expect(page.locator('.reliability-disclosure')).toHaveAttribute('open', '');
      await expectNoHorizontalOverflow(
        page,
        `${viewport.width}px Appearance and reliability details expanded`
      );
    });
  }

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
  ]) {
    test(`${viewport.width}x${viewport.height} keeps QR, reliability, and Download PNG in the initial viewport`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.getByLabel('Website URL').fill('https://example.com/desktop-responsive');
      await expect(page.locator('.reliability-badge')).toHaveText('Good', { timeout: 15000 });

      const positions = await page.evaluate(() => {
        const selectors = ['.preview-stage', '.reliability-heading', '.export-primary-download'];

        return selectors.map((selector) => {
          const element = document.querySelector<HTMLElement>(selector);
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          return { selector, top: rect.top, bottom: rect.bottom };
        });
      });

      for (const position of positions) {
        expect(position).not.toBeNull();
        expect(position!.top, `${position!.selector} begins below the viewport`).toBeLessThan(
          viewport.height
        );
        expect(
          position!.bottom,
          `${position!.selector} extends below the viewport`
        ).toBeLessThanOrEqual(viewport.height);
      }
    });
  }
});
