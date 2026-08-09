import { expect, test } from '@playwright/test';
import { encodeQr } from '../../src/qr/encoder';
import { createStructureMap } from '../../src/qr/structure';
import { planRasterSize } from '../../src/render/raster/plan';
import { renderQrSvg } from '../../src/render/svg';

test.describe('Phase 2 — Browser SVG Rasterization', () => {
  test('rasterizes canonical QR SVG into pixel-snapped ImageData in real browser environment', async ({
    page,
  }) => {
    // 1. Generate canonical SVG in test context
    const { matrix } = encodeQr('PUREQR', {
      ecc: 'M',
      minVersion: 1,
      maxVersion: 1,
      mask: 0,
    });
    const structure = createStructureMap(matrix.version);

    const renderResult = renderQrSvg(matrix, structure, {
      foreground: '#000000',
      background: '#ffffff',
      quietZoneModules: 4,
    });

    const totalModules = renderResult.totalModules; // 29 modules
    const plan = planRasterSize(totalModules, 500); // 17 px/module -> 493px actual size

    // 2. Navigate to application shell page
    await page.goto('/');

    // 3. Perform SVG rasterization inside the real browser DOM environment
    const rasterResult = await page.evaluate(
      async ({ svg, actualSizePx, pixelsPerModule }) => {
        const canvas = document.createElement('canvas');
        canvas.width = actualSizePx;
        canvas.height = actualSizePx;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get 2d context');
        }

        ctx.imageSmoothingEnabled = false;

        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        try {
          const img = new window.Image();
          img.width = actualSizePx;
          img.height = actualSizePx;

          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load SVG into Image'));
            img.src = url;
          });

          ctx.drawImage(img, 0, 0, actualSizePx, actualSizePx);
          const imageData = ctx.getImageData(0, 0, actualSizePx, actualSizePx);
          const data = imageData.data;

          const getPixel = (x: number, y: number) => {
            const index = (y * actualSizePx + x) * 4;
            return [data[index], data[index + 1], data[index + 2], data[index + 3]];
          };

          const ppm = pixelsPerModule;

          // Quiet zone pixel (top-left module 0,0 in canvas -> center pixel of quiet zone)
          const quietZonePixel = getPixel(Math.floor(ppm / 2), Math.floor(ppm / 2));

          // Finder dark module pixel (matrix 0,0 -> module 4,4 in canvas)
          const finderDarkPixel = getPixel(
            Math.floor(4 * ppm + ppm / 2),
            Math.floor(4 * ppm + ppm / 2)
          );

          // Finder separator light module (matrix 7,0 -> module 11,4 in canvas)
          const separatorLightPixel = getPixel(
            Math.floor(11 * ppm + ppm / 2),
            Math.floor(4 * ppm + ppm / 2)
          );

          return {
            canvasSizePx: actualSizePx,
            pixelsPerModule,
            quietZonePixel,
            finderDarkPixel,
            separatorLightPixel,
          };
        } finally {
          URL.revokeObjectURL(url);
        }
      },
      {
        svg: renderResult.svg,
        actualSizePx: plan.actualSizePx,
        pixelsPerModule: plan.pixelsPerModule,
      }
    );

    expect(rasterResult.canvasSizePx).toBe(493); // 17 * 29
    expect(rasterResult.pixelsPerModule).toBe(17);

    // Quiet zone pixel should be white background (255, 255, 255, 255)
    expect(rasterResult.quietZonePixel).toEqual([255, 255, 255, 255]);

    // Finder dark module pixel should be black foreground (0, 0, 0, 255)
    expect(rasterResult.finderDarkPixel).toEqual([0, 0, 0, 255]);

    // Separator light module pixel should be white background (255, 255, 255, 255)
    expect(rasterResult.separatorLightPixel).toEqual([255, 255, 255, 255]);
  });
});
