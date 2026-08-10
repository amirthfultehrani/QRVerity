import { describe, expect, it } from 'vitest';
import { isValidHexColor, normalizeHexColor } from '../../../src/render/colors';

describe('Hex Color Validator & Canonicalizer', () => {
  it('validates 3-digit and 6-digit hex colors', () => {
    expect(isValidHexColor('#fff')).toBe(true);
    expect(isValidHexColor('#000')).toBe(true);
    expect(isValidHexColor('#1a1a1a')).toBe(true);
    expect(isValidHexColor('#FFFFFF')).toBe(true);
    expect(isValidHexColor('#abc')).toBe(true);
    expect(isValidHexColor('#123456')).toBe(true);
  });

  it('rejects invalid or unsafe color expressions', () => {
    expect(isValidHexColor('rgb(255, 255, 255)')).toBe(false);
    expect(isValidHexColor('rgba(0,0,0,1)')).toBe(false);
    expect(isValidHexColor('var(--main-bg)')).toBe(false);
    expect(isValidHexColor('url(https://malicious.example.com)')).toBe(false);
    expect(isValidHexColor('#12345')).toBe(false);
    expect(isValidHexColor('#1234567')).toBe(false);
    expect(isValidHexColor('red')).toBe(false);
    expect(isValidHexColor('"><script>alert(1)</script>')).toBe(false);
  });

  it('canonicalizes 3-digit hex to uppercase 6-digit hex', () => {
    expect(normalizeHexColor('#fff')).toBe('#FFFFFF');
    expect(normalizeHexColor('#000')).toBe('#000000');
    expect(normalizeHexColor('#f0a')).toBe('#FF00AA');
  });

  it('canonicalizes 6-digit hex to uppercase format', () => {
    expect(normalizeHexColor('#1a1a1a')).toBe('#1A1A1A');
    expect(normalizeHexColor('#ffffff')).toBe('#FFFFFF');
    expect(normalizeHexColor('#000000')).toBe('#000000');
  });

  it('throws RangeError for invalid colors', () => {
    expect(() => normalizeHexColor('url(#foo)')).toThrow(RangeError);
    expect(() => normalizeHexColor('var(--color)')).toThrow(RangeError);
    expect(() => normalizeHexColor('invalid')).toThrow(RangeError);
  });
});
