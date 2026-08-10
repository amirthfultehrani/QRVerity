import { describe, expect, it } from 'vitest';
import { generateExportFilename } from '../../../src/export/filename';
import { PayloadType } from '../../../src/payloads/types';

describe('Safe Filename Generator', () => {
  const payloadTypes: PayloadType[] = [
    'url',
    'text',
    'wifi',
    'email',
    'phone',
    'sms',
    'vcard',
    'geo',
    'calendar',
  ];

  it('generates safe ASCII SVG filenames for all payload types without payload text', () => {
    for (const type of payloadTypes) {
      const filename = generateExportFilename(type, 'svg');

      expect(filename).toBe(`qrverity-${type}.svg`);
      expect(filename).not.toContain('http');
      expect(filename).not.toContain('password');
      expect(filename).not.toContain('/');
      expect(filename).not.toContain('\\');
      expect(filename).toBe(filename.toLowerCase());
    }
  });

  it('generates safe ASCII PNG filenames for all payload types without payload text', () => {
    for (const type of payloadTypes) {
      const filename = generateExportFilename(type, 'png');

      expect(filename).toBe(`qrverity-${type}.png`);
      expect(filename).not.toContain('/');
      expect(filename).not.toContain('\\');
      expect(filename).toBe(filename.toLowerCase());
    }
  });
});
