import { describe, expect, it } from 'vitest';
import { ALIGNMENT_PATTERN_CENTERS, createStructureMap } from '../../../src/qr/structure';

describe('PureQR Alignment Pattern Verification', () => {
  it('verifies center coordinates for representative versions', () => {
    expect(ALIGNMENT_PATTERN_CENTERS[2]).toEqual([6, 18]);
    expect(ALIGNMENT_PATTERN_CENTERS[7]).toEqual([6, 22, 38]);
    expect(ALIGNMENT_PATTERN_CENTERS[14]).toEqual([6, 26, 46, 66]);
    expect(ALIGNMENT_PATTERN_CENTERS[21]).toEqual([6, 28, 50, 72, 94]);
    expect(ALIGNMENT_PATTERN_CENTERS[28]).toEqual([6, 26, 50, 74, 98, 122]);
    expect(ALIGNMENT_PATTERN_CENTERS[35]).toEqual([6, 30, 54, 78, 102, 126, 150]);
    expect(ALIGNMENT_PATTERN_CENTERS[40]).toEqual([6, 30, 58, 86, 114, 142, 170]);
  });

  it('verifies alignment pattern placement for all versions 2 through 40', () => {
    for (let version = 2; version <= 40; version++) {
      const map = createStructureMap(version);
      const centers = ALIGNMENT_PATTERN_CENTERS[version]!;
      const s = map.size;

      let expectedValidAlignments = 0;

      for (const cx of centers) {
        for (const cy of centers) {
          // Check if overlaps top-left (0..7), top-right (s-8..s-1, 0..7), or bottom-left (0..7, s-8..s-1)
          const isTopLeft = cx <= 7 && cy <= 7;
          const isTopRight = cx >= s - 8 && cy <= 7;
          const isBottomLeft = cx <= 7 && cy >= s - 8;

          if (isTopLeft || isTopRight || isBottomLeft) {
            // Must NOT have alignment pattern at finder regions
            expect(map.roleAt(cx, cy)).not.toBe('alignment');
          } else {
            expectedValidAlignments++;
            // 5x5 pattern centered at (cx, cy)
            for (let dy = -2; dy <= 2; dy++) {
              for (let dx = -2; dx <= 2; dx++) {
                expect(map.roleAt(cx + dx, cy + dy)).toBe('alignment');
              }
            }
          }
        }
      }

      // Total valid alignment modules should equal expectedValidAlignments * 25
      let actualAlignmentModules = 0;
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          if (map.roleAt(x, y) === 'alignment') actualAlignmentModules++;
        }
      }
      expect(actualAlignmentModules).toBe(expectedValidAlignments * 25);
    }
  });
});
