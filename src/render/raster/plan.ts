/**
 * Pure Raster Size Planner
 *
 * Computes deterministic integer pixels-per-module snapping to guarantee
 * rasterized output exhibits exact, crisp module boundaries without fractional sub-pixel artifacts.
 */

export interface RasterSizePlan {
  pixelsPerModule: number;
  actualSizePx: number;
}

/**
 * Calculates a safe raster output size where each QR module occupies an exact integer number of pixels.
 *
 * Snapping policy:
 * - Uses nearest integer px/module: Math.round(requestedSizePx / totalModules)
 * - Minimum pixelsPerModule = 1
 * - actualSizePx = pixelsPerModule * totalModules
 */
export function planRasterSize(totalModules: number, requestedSizePx: number): RasterSizePlan {
  if (
    typeof totalModules !== 'number' ||
    !Number.isFinite(totalModules) ||
    !Number.isInteger(totalModules) ||
    totalModules < 1
  ) {
    throw new RangeError(`Invalid totalModules: ${totalModules}. Must be an integer >= 1.`);
  }

  if (
    typeof requestedSizePx !== 'number' ||
    !Number.isFinite(requestedSizePx) ||
    requestedSizePx <= 0
  ) {
    throw new RangeError(
      `Invalid requestedSizePx: ${requestedSizePx}. Must be a positive finite number.`
    );
  }

  const pixelsPerModule = Math.max(1, Math.round(requestedSizePx / totalModules));
  const actualSizePx = pixelsPerModule * totalModules;

  return {
    pixelsPerModule,
    actualSizePx,
  };
}
