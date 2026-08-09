import { describe, expect, it } from 'vitest';
import { decodeQrFromPixels } from '../../../src/verify/decode';

describe('jsQR Decoder Wrapper', () => {
  it('returns succeeded = false for blank/non-QR pixel data', () => {
    // 100x100 white pixel buffer (255, 255, 255, 255)
    const width = 100;
    const height = 100;
    const data = new Uint8ClampedArray(width * height * 4);
    data.fill(255);

    const result = decodeQrFromPixels(data, width, height);

    expect(result.succeeded).toBe(false);
    expect(result.decodedText).toBeNull();
  });
});
