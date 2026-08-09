import { describe, expect, it } from 'vitest';
import { encodeQr } from '../../../src/qr/encoder';
import { createStructureMap } from '../../../src/qr/structure';
import { calculateContrastRatio, calculateRelativeLuminance } from '../../../src/render/colors';
import { renderQrSvg } from '../../../src/render/svg';

describe('Phase 7 — Appearance Controls & Structural Safety', () => {
  it('calculates WCAG relative luminance and contrast ratio accurately', () => {
    // Black (#000000) vs White (#FFFFFF) => 21.0:1
    expect(calculateContrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21.0, 1);
    expect(calculateRelativeLuminance('#FFFFFF')).toBeCloseTo(1.0, 2);
    expect(calculateRelativeLuminance('#000000')).toBeCloseTo(0.0, 2);

    // Identical colors => 1.0:1
    expect(calculateContrastRatio('#123456', '#123456')).toBeCloseTo(1.0, 1);
  });

  it('renders DATA module shapes while keeping protected modules conservative', () => {
    const { matrix } = encodeQr('https://pureqr.org/test-appearance', { ecc: 'M' });
    const structureMap = createStructureMap(matrix.version);

    // 1. Square data style
    const squareResult = renderQrSvg(matrix, structureMap, {
      foreground: '#000000',
      background: '#FFFFFF',
      quietZoneModules: 4,
      dataModuleStyle: 'square',
    });
    expect(squareResult.svg).toContain('<rect');
    expect(squareResult.svg).not.toContain('<circle');

    // 2. Dot data style — contains circles for data modules
    const dotResult = renderQrSvg(matrix, structureMap, {
      foreground: '#000000',
      background: '#FFFFFF',
      quietZoneModules: 4,
      dataModuleStyle: 'dot',
    });
    expect(dotResult.svg).toContain('<circle');
    // Must still contain square rects for protected non-data structural modules!
    expect(dotResult.svg).toContain('<rect');

    // 3. Rounded data style — contains rx="0.2"
    const roundedResult = renderQrSvg(matrix, structureMap, {
      foreground: '#000000',
      background: '#FFFFFF',
      quietZoneModules: 4,
      dataModuleStyle: 'rounded',
    });
    expect(roundedResult.svg).toContain('rx="0.2"');
  });

  it('changes only the conservative outer finder corners for Rounded finder style', () => {
    const { matrix } = encodeQr('https://pureqr.org/test-finder-style', { ecc: 'M' });
    const structureMap = createStructureMap(matrix.version);
    const baseOptions = {
      foreground: '#000000',
      background: '#FFFFFF',
      quietZoneModules: 4,
      dataModuleStyle: 'square' as const,
    };

    const squareResult = renderQrSvg(matrix, structureMap, {
      ...baseOptions,
      finderStyle: 'square',
    });
    const roundedResult = renderQrSvg(matrix, structureMap, {
      ...baseOptions,
      finderStyle: 'rounded',
    });

    expect(squareResult.finderStyle).toBe('square');
    expect(roundedResult.finderStyle).toBe('rounded');
    expect(roundedResult.svg).not.toBe(squareResult.svg);

    // Verify explicit finder drawing strategy
    const squareOuterRings = [...squareResult.svg.matchAll(/width="6" height="6"/g)];
    const roundedOuterRings = [...roundedResult.svg.matchAll(/width="6" height="6"/g)];
    expect(squareOuterRings).toHaveLength(3);
    expect(roundedOuterRings).toHaveLength(3);

    // Rounded should have rx attributes, square should not
    const squareRoundedCorners = [...squareResult.svg.matchAll(/rx="1\.5"/g)];
    const roundedCorners = [...roundedResult.svg.matchAll(/rx="1\.5"/g)];
    expect(squareRoundedCorners).toHaveLength(0);
    expect(roundedCorners).toHaveLength(3);

    // Removing the corner rounding from roundedResult should make it exactly equal to squareResult
    const strippedRounded = roundedResult.svg
      .replaceAll(' rx="1.5" ry="1.5"', '')
      .replaceAll(' rx="0.5" ry="0.5"', '');
    expect(strippedRounded).toBe(squareResult.svg);
  });
});
