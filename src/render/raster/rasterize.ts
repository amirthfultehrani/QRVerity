import { RasterizeOptions, RasterizedQr } from '../types';
import { planRasterSize } from './plan';

const VIEWBOX_REGEX = /viewBox=["']0\s+0\s+(\d+)\s+(\d+)["']/;

/**
 * Extracts totalModules from canonical SVG viewBox string.
 */
export function extractTotalModulesFromSvg(svg: string): number {
  if (typeof svg !== 'string') {
    throw new RangeError('SVG input must be a string');
  }

  const match = svg.match(VIEWBOX_REGEX);
  if (!match || !match[1] || !match[2]) {
    throw new Error('Invalid SVG: Missing or malformed viewBox attribute');
  }

  const width = parseInt(match[1], 10);
  const height = parseInt(match[2], 10);

  if (isNaN(width) || isNaN(height) || width !== height || width < 1) {
    throw new Error(`Invalid SVG viewBox dimensions: width=${width}, height=${height}`);
  }

  return width;
}

/**
 * Browser SVG to ImageData Rasterizer
 *
 * Consumes canonical PureQR SVG string and draws it to an HTMLCanvasElement
 * using integer pixel-snapped dimensions before returning raw ImageData.
 *
 * Invariant:
 * Canvas is downstream only. Rasterization consumes canonical SVG, NEVER QrMatrix directly.
 */
export async function rasterizeQrSvg(
  svg: string,
  options: RasterizeOptions
): Promise<RasterizedQr> {
  const totalModules = extractTotalModulesFromSvg(svg);
  const plan = planRasterSize(totalModules, options.requestedSizePx);

  if (typeof document === 'undefined' || typeof HTMLCanvasElement === 'undefined') {
    throw new Error('rasterizeQrSvg requires a DOM environment (window.document)');
  }

  const canvas = document.createElement('canvas');
  canvas.width = plan.actualSizePx;
  canvas.height = plan.actualSizePx;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to obtain 2D rendering context from canvas');
  }

  ctx.imageSmoothingEnabled = false;

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    const img = new window.Image();
    img.width = plan.actualSizePx;
    img.height = plan.actualSizePx;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (_event, _source, _lineno, _colno, error) => {
        reject(error || new Error('Failed to load SVG into Image'));
      };
      img.src = url;
    });

    ctx.drawImage(img, 0, 0, plan.actualSizePx, plan.actualSizePx);

    const imageData = ctx.getImageData(0, 0, plan.actualSizePx, plan.actualSizePx);

    return {
      canvasSizePx: plan.actualSizePx,
      pixelsPerModule: plan.pixelsPerModule,
      imageData,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
