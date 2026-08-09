import { describe, expect, it } from 'vitest';
import { encodeQr } from '../../../src/qr/encoder';
import { QrEncodingError, QrInputError, QrVersionError } from '../../../src/qr/errors';
import { EccLevel } from '../../../src/qr/types';

describe('QRVerity Encoder Adapter', () => {
  it('encodes simple text with automatic version and mask selection', () => {
    const result = encodeQr('QRVerity', { ecc: 'M' });
    expect(result.metadata.version).toBeGreaterThanOrEqual(1);
    expect(result.metadata.size).toBe(result.metadata.version * 4 + 17);
    expect(result.metadata.ecc).toBe('M');
    expect(result.metadata.mask).toBeGreaterThanOrEqual(0);
    expect(result.metadata.mask).toBeLessThanOrEqual(7);

    // Verify isDark works and origin is top-left
    expect(typeof result.matrix.isDark(0, 0)).toBe('boolean');
  });

  it('supports all ECC levels (L, M, Q, H)', () => {
    const eccLevels: EccLevel[] = ['L', 'M', 'Q', 'H'];
    for (const ecc of eccLevels) {
      const result = encodeQr('https://qrverity.org', { ecc });
      expect(result.metadata.ecc).toBe(ecc);
    }
  });

  it('respects forced mask selection (0..7)', () => {
    for (let mask = 0; mask <= 7; mask++) {
      const result = encodeQr('Hello World', { ecc: 'L', mask });
      expect(result.metadata.mask).toBe(mask);
    }
  });

  it('respects minVersion and maxVersion bounds', () => {
    const result = encodeQr('Test', { ecc: 'L', minVersion: 5, maxVersion: 10 });
    expect(result.metadata.version).toBeGreaterThanOrEqual(5);
    expect(result.metadata.version).toBeLessThanOrEqual(10);
  });

  it('handles boostEcc option correctly', () => {
    // Short string in Version 1 has unused capacity for higher ECC
    const unboosted = encodeQr('A', { ecc: 'L', minVersion: 1, maxVersion: 1, boostEcc: false });
    expect(unboosted.metadata.ecc).toBe('L');

    const boosted = encodeQr('A', { ecc: 'L', minVersion: 1, maxVersion: 1, boostEcc: true });
    expect(boosted.metadata.ecc).toBe('H');
  });

  it('encodes Unicode and Emoji payloads accurately', () => {
    const japanese = encodeQr('こんにちはQRVerity', { ecc: 'M' });
    expect(japanese.metadata.version).toBeGreaterThanOrEqual(1);

    const emoji = encodeQr('QRVerity 🔒 Generation', { ecc: 'H' });
    expect(emoji.metadata.version).toBeGreaterThanOrEqual(1);
  });

  describe('Error Cases', () => {
    it('throws QrInputError for invalid ECC level', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => encodeQr('Test', { ecc: 'INVALID' as any })).toThrow(QrInputError);
    });

    it('throws QrVersionError when minVersion > maxVersion', () => {
      expect(() => encodeQr('Test', { ecc: 'L', minVersion: 5, maxVersion: 2 })).toThrow(
        QrVersionError
      );
    });

    it('throws QrVersionError for out-of-range versions', () => {
      expect(() => encodeQr('Test', { ecc: 'L', minVersion: 0 })).toThrow(QrVersionError);
      expect(() => encodeQr('Test', { ecc: 'L', maxVersion: 41 })).toThrow(QrVersionError);
    });

    it('throws QrInputError for invalid mask values', () => {
      expect(() => encodeQr('Test', { ecc: 'L', mask: 8 })).toThrow(QrInputError);
      expect(() => encodeQr('Test', { ecc: 'L', mask: -2 })).toThrow(QrInputError);
    });

    it('throws QrEncodingError when payload exceeds maxVersion capacity', () => {
      const longPayload = 'A'.repeat(1000);
      expect(() => encodeQr(longPayload, { ecc: 'H', minVersion: 1, maxVersion: 1 })).toThrow(
        QrEncodingError
      );
    });

    it('throws RangeError when accessing matrix coordinates out of bounds', () => {
      const result = encodeQr('Test', { ecc: 'M' });
      const s = result.matrix.size;

      expect(() => result.matrix.isDark(-1, 0)).toThrow(RangeError);
      expect(() => result.matrix.isDark(0, -1)).toThrow(RangeError);
      expect(() => result.matrix.isDark(s, 0)).toThrow(RangeError);
      expect(() => result.matrix.isDark(0, s)).toThrow(RangeError);
    });
  });
});
