/**
 * QRVerity Color Validator & Contrast Calculator
 *
 * Enforces strict CSS hex color validation to prevent CSS injection,
 * malicious URLs, external resource references, or invalid color expressions.
 * Calculates WCAG 2.1 relative luminance and contrast ratios.
 */

const HEX_3_REGEX = /^#([0-9a-fA-F]{3})$/;
const HEX_6_REGEX = /^#([0-9a-fA-F]{6})$/;

/**
 * Validates whether a color string is a valid CSS hex color (#RGB or #RRGGBB).
 */
export function isValidHexColor(color: string): boolean {
  if (typeof color !== 'string') {
    return false;
  }
  const trimmed = color.trim();
  return HEX_3_REGEX.test(trimmed) || HEX_6_REGEX.test(trimmed);
}

/**
 * Normalizes a valid CSS hex color into canonical #RRGGBB uppercase format.
 * Throws RangeError if the color format is invalid or rejected by safety rules.
 */
export function normalizeHexColor(color: string): string {
  if (typeof color !== 'string') {
    throw new RangeError('Color must be a string');
  }

  const trimmed = color.trim();

  const match6 = trimmed.match(HEX_6_REGEX);
  if (match6 && match6[1]) {
    return `#${match6[1].toUpperCase()}`;
  }

  const match3 = trimmed.match(HEX_3_REGEX);
  if (match3 && match3[1] && match3[1].length === 3) {
    const hex = match3[1];
    const r = hex.charAt(0);
    const g = hex.charAt(1);
    const b = hex.charAt(2);
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  throw new RangeError(
    `Invalid hex color format: "${color}". Only #RGB and #RRGGBB hex formats are allowed.`
  );
}

/**
 * Calculates WCAG 2.1 relative luminance for a normalized hex color (#RRGGBB).
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
export function calculateRelativeLuminance(hexColor: string): number {
  const hex = normalizeHexColor(hexColor);
  const r8 = parseInt(hex.substring(1, 3), 16);
  const g8 = parseInt(hex.substring(3, 5), 16);
  const b8 = parseInt(hex.substring(5, 7), 16);

  const adjustChannel = (c8: number): number => {
    const srgb = c8 / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };

  const r = adjustChannel(r8);
  const g = adjustChannel(g8);
  const b = adjustChannel(b8);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates contrast ratio between two hex colors.
 * Contrast Ratio = (L1 + 0.05) / (L2 + 0.05) where L1 is lighter and L2 is darker.
 * Returns ratio in range [1.0, 21.0].
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const l1 = calculateRelativeLuminance(color1);
  const l2 = calculateRelativeLuminance(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHexColor(hex);
  const r = parseInt(normalized.substring(1, 3), 16);
  const g = parseInt(normalized.substring(3, 5), 16);
  const b = parseInt(normalized.substring(5, 7), 16);
  return [r, g, b];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r * 255, g * 255, b * 255];
}

export function suggestSafeColors(fgHex: string, bgHex: string): { fg: string; bg: string } {
  let currentFg = normalizeHexColor(fgHex);
  let currentBg = normalizeHexColor(bgHex);

  // QR codes require a dark foreground and light background for reliable scanning.
  // If the colors are inverted (foreground lighter than background), swap them first.
  if (calculateRelativeLuminance(currentFg) > calculateRelativeLuminance(currentBg)) {
    const temp = currentFg;
    currentFg = currentBg;
    currentBg = temp;
  }

  if (calculateContrastRatio(currentFg, currentBg) >= 4.5) {
    return { fg: currentFg, bg: currentBg };
  }

  const [r1, g1, b1] = hexToRgb(currentFg);
  const [r2, g2, b2] = hexToRgb(currentBg);
  const [h1, s1, l1] = rgbToHsl(r1, g1, b1);
  const [h2, s2, l2] = rgbToHsl(r2, g2, b2);

  let currentL1 = l1;
  let currentL2 = l2;

  // We already swapped if inverted, so foreground is guaranteed to be darker or equal
  const isFgDarker = true;

  for (let i = 0; i < 100; i++) {
    currentFg = rgbToHex(...hslToRgb(h1, s1, currentL1));
    currentBg = rgbToHex(...hslToRgb(h2, s2, currentL2));

    if (calculateContrastRatio(currentFg, currentBg) >= 4.5) {
      break;
    }

    if (isFgDarker) {
      currentL1 = Math.max(0, currentL1 - 0.02);
      currentL2 = Math.min(1, currentL2 + 0.02);
    } else {
      currentL1 = Math.min(1, currentL1 + 0.02);
      currentL2 = Math.max(0, currentL2 - 0.02);
    }
  }

  return { fg: currentFg, bg: currentBg };
}
