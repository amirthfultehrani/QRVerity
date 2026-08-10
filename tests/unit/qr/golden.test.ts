import { describe, expect, it } from 'vitest';
import { encodeQr } from '../../../src/qr/encoder';
import { EccLevel, QrMatrix } from '../../../src/qr/types';

/**
 * Converts a QrMatrix into a deterministic row-major string of 1s and 0s.
 */
function serializeMatrix(matrix: QrMatrix): string {
  const lines: string[] = [];
  for (let y = 0; y < matrix.size; y++) {
    let row = '';
    for (let x = 0; x < matrix.size; x++) {
      row += matrix.isDark(x, y) ? '1' : '0';
    }
    lines.push(row);
  }
  return lines.join('\n');
}

/**
 * Computes a simple deterministic 32-bit FNV-1a hash of a string for vector locking.
 */
function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

describe('QRVerity Deterministic Golden Vectors', () => {
  interface GoldenTestCase {
    name: string;
    payload: string;
    ecc: EccLevel;
    minVersion: number;
    maxVersion: number;
    mask: number;
    expectedVersion: number;
    expectedSize: number;
    expectedHash: string;
  }

  const goldenSuite: GoldenTestCase[] = [
    {
      name: 'Numeric Payload',
      payload: '1234567890',
      ecc: 'L',
      minVersion: 1,
      maxVersion: 1,
      mask: 0,
      expectedVersion: 1,
      expectedSize: 21,
      expectedHash: 'adb9c085',
    },
    {
      name: 'Alphanumeric Payload',
      payload: 'HELLO WORLD',
      ecc: 'M',
      minVersion: 1,
      maxVersion: 1,
      mask: 1,
      expectedVersion: 1,
      expectedSize: 21,
      expectedHash: 'c525cf37',
    },
    {
      name: 'URL Payload',
      payload: 'https://example.com',
      ecc: 'Q',
      minVersion: 2,
      maxVersion: 2,
      mask: 2,
      expectedVersion: 2,
      expectedSize: 25,
      expectedHash: '104d4741',
    },
    {
      name: 'ASCII Text Payload',
      payload: 'PureQR',
      ecc: 'H',
      minVersion: 1,
      maxVersion: 1,
      mask: 3,
      expectedVersion: 1,
      expectedSize: 21,
      expectedHash: 'a42d9b4b',
    },
    {
      name: 'Unicode Payload (Japanese)',
      payload: 'こんにちは',
      ecc: 'M',
      minVersion: 2,
      maxVersion: 2,
      mask: 4,
      expectedVersion: 2,
      expectedSize: 25,
      expectedHash: '4d3f2085',
    },
    {
      name: 'Emoji Payload',
      payload: 'PureQR 🔒',
      ecc: 'H',
      minVersion: 2,
      maxVersion: 2,
      mask: 5,
      expectedVersion: 2,
      expectedSize: 25,
      expectedHash: '26632e20',
    },
    {
      name: 'Longer Payload (Version 7+)',
      payload:
        'PureQR is a private open-source QR generator that verifies rendered QR codes before downloading.',
      ecc: 'L',
      minVersion: 7,
      maxVersion: 7,
      mask: 6,
      expectedVersion: 7,
      expectedSize: 45,
      expectedHash: 'ab05c2a9',
    },
  ];

  goldenSuite.forEach((tc) => {
    it(`renders golden vector: ${tc.name}`, () => {
      const result = encodeQr(tc.payload, {
        ecc: tc.ecc,
        minVersion: tc.minVersion,
        maxVersion: tc.maxVersion,
        mask: tc.mask,
        boostEcc: false,
      });

      expect(result.metadata.version).toBe(tc.expectedVersion);
      expect(result.metadata.size).toBe(tc.expectedSize);
      expect(result.metadata.ecc).toBe(tc.ecc);
      expect(result.metadata.mask).toBe(tc.mask);

      const serialized = serializeMatrix(result.matrix);
      const hash = fnv1aHash(serialized);

      // Lock against exact hash
      expect(hash).toBe(tc.expectedHash);
    });
  });
});
