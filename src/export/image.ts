import { PayloadType } from '../payloads/types';
import { rasterizeQrSvg } from '../render/raster/rasterize';
import { generateExportFilename } from './filename';
import { ImageExportResult } from './types';

/**
 * Exports canonical SVG to pixel-snapped Image Blob using the Phase 2 rasterization pipeline.
 */
export async function exportQrImage(
  svg: string,
  payloadType: PayloadType,
  requestedSizePx: number,
  format: 'png' | 'jpeg' | 'webp' = 'png'
): Promise<ImageExportResult> {
  const raster = await rasterizeQrSvg(svg, { requestedSizePx });

  if (typeof document === 'undefined') {
    throw new Error('exportQrPng requires a DOM environment');
  }

  const canvas = document.createElement('canvas');
  canvas.width = raster.canvasSizePx;
  canvas.height = raster.canvasSizePx;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to obtain 2D rendering context for PNG export');
  }

  // If exporting JPEG, we should fill a white background first, because SVG transparency becomes black in JPEG
  if (format === 'jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.putImageData(raster.imageData, 0, 0);

  const mimeType = `image/${format}`;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) {
          resolve(b);
        } else {
          reject(new Error(`Failed to generate ${format.toUpperCase()} blob from canvas`));
        }
      },
      mimeType,
      format === 'jpeg' || format === 'webp' ? 0.95 : undefined
    );
  });

  const filename = generateExportFilename(payloadType, format);

  return {
    blob,
    filename,
    requestedSizePx,
    actualSizePx: raster.canvasSizePx,
    pixelsPerModule: raster.pixelsPerModule,
  };
}
