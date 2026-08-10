import { describe, expect, it } from 'vitest';
import { createStructureMap } from '../../../src/qr/structure';

describe('QRVerity Structural Region Map (Versions 1–40 Invariants)', () => {
  it('validates structural invariant rules for every QR version 1 through 40', () => {
    for (let version = 1; version <= 40; version++) {
      const map = createStructureMap(version);
      const expectedSize = 17 + 4 * version;

      // 1. Matrix size formula
      expect(map.version).toBe(version);
      expect(map.size).toBe(expectedSize);

      const s = map.size;
      let totalModules = 0;
      let finderCount = 0;
      let separatorCount = 0;
      let timingCount = 0;
      let formatCount = 0;
      let versionCount = 0;
      let darkModuleCount = 0;
      let alignmentCount = 0;
      let dataCount = 0;

      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          totalModules++;
          const role = map.roleAt(x, y);
          const isProt = map.isProtected(x, y);

          if (role === 'data') {
            expect(isProt).toBe(false);
            dataCount++;
          } else {
            expect(isProt).toBe(true);
          }

          switch (role) {
            case 'finder':
              finderCount++;
              break;
            case 'separator':
              separatorCount++;
              break;
            case 'timing':
              timingCount++;
              break;
            case 'format':
              formatCount++;
              break;
            case 'version':
              versionCount++;
              break;
            case 'dark-module':
              darkModuleCount++;
              break;
            case 'alignment':
              alignmentCount++;
              break;
          }
        }
      }

      // Assert total count matches s * s
      expect(totalModules).toBe(s * s);

      // Assert 3 Finders = 3 * 49 = 147 modules
      expect(finderCount).toBe(147);

      // Assert Separators count (each separator has 15 modules => 45 total)
      expect(separatorCount).toBe(45);

      // Assert Timing patterns present and protected
      expect(timingCount).toBeGreaterThan(0);
      for (let x = 8; x <= s - 9; x++) {
        const role = map.roleAt(x, 6);
        expect(role === 'timing' || role === 'alignment').toBe(true);
        expect(map.isProtected(x, 6)).toBe(true);
      }
      for (let y = 8; y <= s - 9; y++) {
        const role = map.roleAt(6, y);
        expect(role === 'timing' || role === 'alignment').toBe(true);
        expect(map.isProtected(6, y)).toBe(true);
      }

      // Assert Format info: 30 modules (15 top-left, 8 top-right, 7 bottom-left)
      expect(formatCount).toBe(30);

      // Assert Fixed Dark Module: exactly 1 module at (8, s - 8)
      expect(darkModuleCount).toBe(1);
      expect(map.roleAt(8, s - 8)).toBe('dark-module');

      // Assert Version Info: 0 modules for v < 7, 36 modules (2 * 18) for v >= 7
      if (version < 7) {
        expect(versionCount).toBe(0);
      } else {
        expect(versionCount).toBe(36);

        // Verify bottom-left version block (3x6)
        for (let y = s - 11; y <= s - 9; y++) {
          for (let x = 0; x <= 5; x++) {
            expect(map.roleAt(x, y)).toBe('version');
          }
        }

        // Verify top-right version block (6x3)
        for (let y = 0; y <= 5; y++) {
          for (let x = s - 11; x <= s - 9; x++) {
            expect(map.roleAt(x, y)).toBe('version');
          }
        }
      }

      // Assert Alignment patterns: 0 for v1, >0 for v2..40
      if (version === 1) {
        expect(alignmentCount).toBe(0);
      } else {
        expect(alignmentCount).toBeGreaterThan(0);
        // Each alignment pattern has 25 modules
        expect(alignmentCount % 25).toBe(0);
      }

      // Assert remaining data modules is positive
      expect(dataCount).toBeGreaterThan(0);
    }
  }, 30000);

  describe('Boundary Behavior', () => {
    it('throws RangeError for invalid version constructor arguments', () => {
      expect(() => createStructureMap(0)).toThrow(RangeError);
      expect(() => createStructureMap(41)).toThrow(RangeError);
    });

    it('throws RangeError for out-of-bounds coordinates', () => {
      const map = createStructureMap(1); // size 21
      const s = map.size;

      expect(() => map.roleAt(-1, 0)).toThrow(RangeError);
      expect(() => map.roleAt(0, -1)).toThrow(RangeError);
      expect(() => map.roleAt(s, 0)).toThrow(RangeError);
      expect(() => map.roleAt(0, s)).toThrow(RangeError);

      expect(() => map.isProtected(-1, 0)).toThrow(RangeError);
      expect(() => map.isProtected(0, -1)).toThrow(RangeError);
      expect(() => map.isProtected(s, 0)).toThrow(RangeError);
      expect(() => map.isProtected(0, s)).toThrow(RangeError);
    });
  });
});
