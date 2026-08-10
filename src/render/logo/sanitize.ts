import { QrLogoAsset } from '../types';
import { DEFAULT_LOGO_LIMITS, LogoValidationLimits } from './types';

const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

/**
 * Validates, decodes, and re-rasterizes a local image file to create a clean,
 * metadata-stripped PNG data URL for canonical SVG embedding.
 *
 * Rules:
 * - Accepts PNG, JPEG, WebP only. SVG files and unknown types are strictly rejected.
 * - Enforces 5MB file byte limit and 16 megapixel dimension limits.
 * - Re-decodes image via Canvas to strip EXIF/IPTC/XMP metadata completely.
 */
export async function sanitizeLogoFile(
  file: File,
  limits: LogoValidationLimits = DEFAULT_LOGO_LIMITS
): Promise<QrLogoAsset> {
  if (!file) {
    throw new Error('No file provided for logo sanitization.');
  }

  let mimeType = file.type.toLowerCase().trim();

  if (!mimeType && file.name) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'webp') mimeType = 'image/webp';
  }

  if (mimeType === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    throw new Error('SVG logos are strictly forbidden for security and structural safety.');
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(
      `Unsupported logo file format: ${file.type || 'unknown'}. Only PNG, JPEG, and WebP images are allowed.`
    );
  }

  if (file.size > limits.maxFileSizeBytes) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`Logo file size (${sizeMb} MB) exceeds maximum allowed limit of 5 MB.`);
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Logo sanitization requires a browser DOM environment.');
  }

  let width = 0;
  let height = 0;
  let canvas: HTMLCanvasElement | null = null;

  // Try createImageBitmap first, fallback to FileReader + Image on any exception
  let decodedSuccess = false;

  if (typeof window.createImageBitmap === 'function') {
    try {
      const bitmap = await window.createImageBitmap(file);
      width = bitmap.width;
      height = bitmap.height;

      if (
        width > 0 &&
        height > 0 &&
        width <= limits.maxDimensionPx &&
        height <= limits.maxDimensionPx &&
        width * height <= limits.maxPixels
      ) {
        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0, width, height);
          bitmap.close();
          decodedSuccess = true;
        } else {
          bitmap.close();
        }
      } else {
        bitmap.close();
      }
    } catch {
      decodedSuccess = false;
    }
  }

  if (!decodedSuccess) {
    // Fallback via FileReader and Image element
    const imgUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read logo file.'));
      reader.readAsDataURL(file);
    });

    const img = new window.Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () =>
        reject(new Error('Failed to decode logo image file. File may be corrupted.'));
      img.src = imgUrl;
    });

    width = img.naturalWidth || img.width;
    height = img.naturalHeight || img.height;

    if (width <= 0 || height <= 0) {
      throw new Error('Invalid image dimensions (0x0).');
    }

    if (width > limits.maxDimensionPx || height > limits.maxDimensionPx) {
      throw new Error(
        `Image dimensions (${width} × ${height} px) exceed maximum allowed dimension limit of ${limits.maxDimensionPx} px.`
      );
    }

    if (width * height > limits.maxPixels) {
      throw new Error(
        `Image resolution (${((width * height) / 1000000).toFixed(1)} Mpx) exceeds maximum allowed pixel count of 16 Mpx.`
      );
    }

    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to obtain 2D context for logo canvas rendering.');
    }

    ctx.drawImage(img, 0, 0, width, height);
  }

  // Export clean PNG Data URL (strips all EXIF/IPTC/XMP metadata)
  const finalCanvas = canvas || document.createElement('canvas');
  const dataUrl = finalCanvas.toDataURL('image/png');

  return {
    dataUrl,
    width,
    height,
    mimeType: 'image/png',
    filename: file.name,
  };
}
