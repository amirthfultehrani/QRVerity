/**
 * PureQR jsQR Decoder Wrapper
 *
 * Isolates jsQR behind a PureQR-owned interface.
 * No UI component or general application module should import jsQR directly.
 *
 * Configuration:
 * - inversionAttempts: 'dontInvert' (explicit, not relying on jsQR default).
 *   PureQR Phase 6 renders standard dark-on-light QR codes.
 *   Future inverted-color support must revisit this setting deliberately.
 */

import jsQR from 'jsqr';
import { DecodeResult } from './types';

/**
 * Decodes a QR code from raw RGBA pixel data using jsQR.
 *
 * @param data - Uint8ClampedArray of RGBA pixel values
 * @param width - Pixel width of the raster
 * @param height - Pixel height of the raster
 * @returns PureQR-owned DecodeResult (never exposes jsQR-specific objects)
 */
export function decodeQrFromPixels(
  data: Uint8ClampedArray,
  width: number,
  height: number
): DecodeResult {
  const result = jsQR(data, width, height, {
    inversionAttempts: 'dontInvert',
  });

  if (!result) {
    return {
      succeeded: false,
      decodedText: null,
    };
  }

  return {
    succeeded: true,
    decodedText: result.data,
  };
}
