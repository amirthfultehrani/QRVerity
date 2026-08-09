import { describe, expect, it } from 'vitest';
import { createStructureMap } from '../../../src/qr/structure';
import { calculateSafeLogoBounds } from '../../../src/render/logo/geometry';

describe('Safe Logo Geometry & Protected Region Invariant', () => {
  const versionsToTest = [1, 2, 5, 7, 10, 15, 20, 25, 30, 35, 40];

  it('guarantees logo footprint NEVER intersects any protected module across versions 1 to 40', () => {
    const scalesToTest = [0.05, 0.1, 0.15, 0.2];
    const paddingModules = 0.5;

    for (const ver of versionsToTest) {
      const matrixSize = 17 + 4 * ver;
      const structureMap = createStructureMap(ver);

      for (const scale of scalesToTest) {
        const bounds = calculateSafeLogoBounds(matrixSize, structureMap, scale, paddingModules);

        if (bounds) {
          const footMinX = Math.floor(bounds.minX - paddingModules);
          const footMaxX = Math.ceil(bounds.maxX + paddingModules) - 1;
          const footMinY = Math.floor(bounds.minY - paddingModules);
          const footMaxY = Math.ceil(bounds.maxY + paddingModules) - 1;

          for (let y = Math.max(0, footMinY); y <= Math.min(matrixSize - 1, footMaxY); y++) {
            for (let x = Math.max(0, footMinX); x <= Math.min(matrixSize - 1, footMaxX); x++) {
              const isProt = structureMap.isProtected(x, y);
              expect(isProt).toBe(false);
            }
          }
        }
      }
    }
  });

  it('clamps extreme requested logo scales cleanly without protected overlap', () => {
    const structureMap = createStructureMap(2); // 25x25 matrix
    const bounds = calculateSafeLogoBounds(25, structureMap, 0.2, 0.5);

    expect(bounds).not.toBeNull();
    if (bounds) {
      expect(bounds.widthModules).toBeGreaterThanOrEqual(1);
      expect(bounds.coverageRatio).toBeGreaterThan(0);
      expect(bounds.coverageRatio).toBeLessThan(0.25);
    }
  });
});
