import { QrStructureMap } from '../../qr/types';
import { SafeLogoBounds } from './types';

/**
 * Pure Safe Logo Geometry Calculator
 *
 * Computes the maximum centered logo footprint + padding box that contains
 * ZERO protected modules (`structureMap.isProtected(x, y) === false`).
 *
 * Hard Invariant:
 * Protected QR regions (finder, separator, timing, alignment, format, version, dark-module)
 * MUST NEVER be covered by a logo or logo backing padding.
 */
export function calculateSafeLogoBounds(
  matrixSize: number,
  structureMap: QrStructureMap,
  requestedScale: number = 0.15,
  paddingModules: number = 0.5
): SafeLogoBounds | null {
  if (matrixSize < 21 || !structureMap) {
    return null;
  }

  // Hard UI/product scale cap is 20%
  const targetScale = Math.min(Math.max(0.05, requestedScale), 0.2);

  let totalDataModules = 0;
  for (let y = 0; y < matrixSize; y++) {
    for (let x = 0; x < matrixSize; x++) {
      if (structureMap.roleAt(x, y) === 'data') {
        totalDataModules++;
      }
    }
  }

  const center = matrixSize / 2;
  let targetWidthModules = Math.round(targetScale * matrixSize);
  // Ensure odd module width for symmetric centering if matrixSize is odd
  if (matrixSize % 2 === 1 && targetWidthModules % 2 === 0) {
    targetWidthModules = Math.max(1, targetWidthModules - 1);
  }

  let isClamped = false;

  // Shrink loop: decrease width until the full footprint (logo + padding) intersects 0 protected modules
  for (let currentWidth = targetWidthModules; currentWidth >= 1; currentWidth -= 1) {
    const halfImage = currentWidth / 2;
    const imgMinX = center - halfImage;
    const imgMaxX = center + halfImage;
    const imgMinY = center - halfImage;
    const imgMaxY = center + halfImage;

    const footMinX = Math.floor(imgMinX - paddingModules);
    const footMaxX = Math.ceil(imgMaxX + paddingModules) - 1;
    const footMinY = Math.floor(imgMinY - paddingModules);
    const footMaxY = Math.ceil(imgMaxY + paddingModules) - 1;

    let intersectsProtected = false;

    for (let y = Math.max(0, footMinY); y <= Math.min(matrixSize - 1, footMaxY); y++) {
      for (let x = Math.max(0, footMinX); x <= Math.min(matrixSize - 1, footMaxX); x++) {
        if (structureMap.isProtected(x, y)) {
          intersectsProtected = true;
          break;
        }
      }
      if (intersectsProtected) break;
    }

    if (!intersectsProtected) {
      // Calculate occluded data modules
      let occludedDataModules = 0;
      for (let y = Math.max(0, footMinY); y <= Math.min(matrixSize - 1, footMaxY); y++) {
        for (let x = Math.max(0, footMinX); x <= Math.min(matrixSize - 1, footMaxX); x++) {
          if (structureMap.roleAt(x, y) === 'data') {
            occludedDataModules++;
          }
        }
      }

      const coverageRatio = totalDataModules > 0 ? occludedDataModules / totalDataModules : 0;
      const effectiveScale = currentWidth / matrixSize;

      return {
        minX: imgMinX,
        minY: imgMinY,
        maxX: imgMaxX,
        maxY: imgMaxY,
        widthModules: currentWidth,
        heightModules: currentWidth,
        occludedDataModules,
        totalDataModules,
        coverageRatio,
        isClamped: isClamped || currentWidth < targetWidthModules,
        effectiveScale,
      };
    }

    isClamped = true;
  }

  // No safe centered logo box exists
  return null;
}
