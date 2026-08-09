import { describe, expect, it } from 'vitest';
import { encodeQr } from '../../../src/qr/encoder';
import { QrMatrixImpl } from '../../../src/qr/matrix';
import { createStructureMap } from '../../../src/qr/structure';
import { renderQrSvg } from '../../../src/render/svg';

describe('Canonical SVG Renderer', () => {
  it('renders a deterministic Version 1 QR SVG with quietZone=4', () => {
    const { matrix } = encodeQr('QRVERITY-TEST', {
      ecc: 'M',
      minVersion: 1,
      maxVersion: 1,
      mask: 0,
    });
    const structure = createStructureMap(matrix.version);

    const result = renderQrSvg(matrix, structure, {
      foreground: '#000000',
      background: '#ffffff',
      quietZoneModules: 4,
    });

    expect(result.matrixSize).toBe(21);
    expect(result.quietZoneModules).toBe(4);
    expect(result.totalModules).toBe(29);
    expect(result.foreground).toBe('#000000');
    expect(result.background).toBe('#FFFFFF');

    expect(result.svg).toContain('viewBox="0 0 29 29"');
    expect(result.svg).toContain('<rect width="29" height="29" fill="#FFFFFF"/>');
    expect(result.svg).toContain('<g fill="#000000">');
  });

  it('renders Version 2 and Version 7 QR symbols accurately', () => {
    const { matrix: v2Matrix } = encodeQr('VERSION-2-TEST', {
      ecc: 'M',
      minVersion: 2,
      maxVersion: 2,
      mask: 1,
    });
    const v2Struct = createStructureMap(v2Matrix.version);
    const v2Result = renderQrSvg(v2Matrix, v2Struct, {
      foreground: '#1a1a1a',
      background: '#ffffff',
      quietZoneModules: 4,
    });
    expect(v2Result.matrixSize).toBe(25);
    expect(v2Result.totalModules).toBe(33);

    const { matrix: v7Matrix } = encodeQr('VERSION-7-TEST-PAYLOAD-WITH-MORE-DATA', {
      ecc: 'H',
      minVersion: 7,
      maxVersion: 7,
      mask: 2,
    });
    const v7Struct = createStructureMap(v7Matrix.version);
    const v7Result = renderQrSvg(v7Matrix, v7Struct, {
      foreground: '#000',
      background: '#fff',
      quietZoneModules: 5,
    });
    expect(v7Result.matrixSize).toBe(45);
    expect(v7Result.totalModules).toBe(55);
  });

  it('enforces HARD minimum quiet zone of 4 modules', () => {
    const { matrix } = encodeQr('QUIET-ZONE-TEST', { ecc: 'L' });
    const structure = createStructureMap(matrix.version);

    const invalidQuietZones = [0, 1, 2, 3, -1, -4, 3.5, NaN, Infinity];

    for (const qz of invalidQuietZones) {
      expect(() =>
        renderQrSvg(matrix, structure, {
          foreground: '#000',
          background: '#fff',
          quietZoneModules: qz,
        })
      ).toThrow(RangeError);
    }
  });

  it('allows quiet zone > 4', () => {
    const { matrix } = encodeQr('QUIET-ZONE-LARGE', { ecc: 'L' });
    const structure = createStructureMap(matrix.version);

    const result = renderQrSvg(matrix, structure, {
      foreground: '#000000',
      background: '#ffffff',
      quietZoneModules: 8,
    });

    expect(result.quietZoneModules).toBe(8);
    expect(result.totalModules).toBe(matrix.size + 16);
  });

  it('rejects mismatched matrix and structure map inputs', () => {
    const { matrix: matrixV1 } = encodeQr('V1', { ecc: 'L', minVersion: 1, maxVersion: 1 });
    const structV2 = createStructureMap(2);

    expect(() =>
      renderQrSvg(matrixV1, structV2, {
        foreground: '#000',
        background: '#fff',
        quietZoneModules: 4,
      })
    ).toThrow(RangeError);
  });

  it('matches dark module count 1-to-1 with SVG rect count (Module Count Test)', () => {
    const { matrix } = encodeQr('MODULE-COUNT-VERIFICATION', { ecc: 'Q', minVersion: 3 });
    const structure = createStructureMap(matrix.version);

    let darkCount = 0;
    for (let y = 0; y < matrix.size; y++) {
      for (let x = 0; x < matrix.size; x++) {
        // finder modules are drawn explicitly outside the module loop
        if (matrix.isDark(x, y) && structure.roleAt(x, y) !== 'finder') {
          darkCount++;
        }
      }
    }

    // We explicitly draw 2 rects per finder pattern (outer ring and inner square),
    // and there are 3 finder patterns -> 6 rects total.
    darkCount += 6;

    const result = renderQrSvg(matrix, structure, {
      foreground: '#000000',
      background: '#ffffff',
      quietZoneModules: 4,
    });

    // Count 1x1 module rects in <g fill="..."> section
    const moduleGroupMatch = result.svg.match(/<g fill="#000000">(.*?)<\/g>/);
    expect(moduleGroupMatch).not.toBeNull();

    const groupContent = moduleGroupMatch?.[1] ?? '';
    const rectMatches = groupContent.match(/<rect /g);
    const svgRectCount = rectMatches ? rectMatches.length : 0;

    expect(svgRectCount).toBe(darkCount);
  });

  it('preserves x/y coordinate orientation without transposition (Asymmetric Orientation Test)', () => {
    // Version 1 is size 21x21.
    // Create asymmetric matrix where (10, 2) is dark and (2, 10) is light.
    const modules = new Uint8Array(21 * 21);
    modules[2 * 21 + 10] = 1; // (x=10, y=2) is dark

    const matrix = new QrMatrixImpl(1, 'L', 0, modules);
    const structure = createStructureMap(1);

    const result = renderQrSvg(matrix, structure, {
      foreground: '#000000',
      background: '#ffffff',
      quietZoneModules: 4,
    });

    // With quietZone=4:
    // (x=10, y=2) becomes rect at x=14, y=6
    expect(result.svg).toContain('<rect x="14" y="6" width="1" height="1"/>');

    // Must NOT contain transposed rect at x=6, y=14
    expect(result.svg).not.toContain('<rect x="6" y="14" width="1" height="1"/>');
  });

  it('guarantees clean SVG output without unsafe elements or external references', () => {
    const { matrix } = encodeQr('SECURITY-CHECK', { ecc: 'M' });
    const structure = createStructureMap(matrix.version);

    const result = renderQrSvg(matrix, structure, {
      foreground: '#000000',
      background: '#ffffff',
      quietZoneModules: 4,
    });

    const svg = result.svg.toLowerCase();

    // Remove the valid standard SVG XML namespace before checking external URLs
    const sanitizedSvg = svg.replace('http://www.w3.org/2000/svg', '');

    expect(sanitizedSvg).not.toContain('<script');
    expect(sanitizedSvg).not.toContain('foreignobject');
    expect(sanitizedSvg).not.toContain('http:');
    expect(sanitizedSvg).not.toContain('https:');
    expect(sanitizedSvg).not.toContain('onload=');
    expect(sanitizedSvg).not.toContain('onerror=');
    expect(sanitizedSvg).not.toContain('style=');
  });

  it('does not mutate input matrix or structure map', () => {
    const { matrix } = encodeQr('IMMUTABILITY-CHECK', { ecc: 'H' });
    const structure = createStructureMap(matrix.version);

    const isDarkBefore = matrix.isDark(5, 5);
    const roleBefore = structure.roleAt(5, 5);

    renderQrSvg(matrix, structure, {
      foreground: '#000000',
      background: '#ffffff',
      quietZoneModules: 4,
    });

    expect(matrix.isDark(5, 5)).toBe(isDarkBefore);
    expect(structure.roleAt(5, 5)).toBe(roleBefore);
  });
});
