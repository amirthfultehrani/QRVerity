import { QrModuleRole, QrStructureMap } from './types';

/**
 * Standard ISO/IEC 18004 Alignment Pattern Center Locations for Versions 1..40.
 */
export const ALIGNMENT_PATTERN_CENTERS: ReadonlyArray<ReadonlyArray<number>> = [
  [], // Version 0 (unused)
  [], // Version 1
  [6, 18], // Version 2
  [6, 22], // Version 3
  [6, 26], // Version 4
  [6, 30], // Version 5
  [6, 34], // Version 6
  [6, 22, 38], // Version 7
  [6, 24, 42], // Version 8
  [6, 26, 46], // Version 9
  [6, 28, 50], // Version 10
  [6, 30, 54], // Version 11
  [6, 32, 58], // Version 12
  [6, 34, 62], // Version 13
  [6, 26, 46, 66], // Version 14
  [6, 26, 48, 70], // Version 15
  [6, 26, 50, 74], // Version 16
  [6, 30, 54, 78], // Version 17
  [6, 30, 56, 82], // Version 18
  [6, 30, 58, 86], // Version 19
  [6, 34, 62, 90], // Version 20
  [6, 28, 50, 72, 94], // Version 21
  [6, 26, 50, 74, 98], // Version 22
  [6, 30, 54, 78, 102], // Version 23
  [6, 28, 54, 80, 106], // Version 24
  [6, 32, 58, 84, 110], // Version 25
  [6, 30, 58, 86, 114], // Version 26
  [6, 34, 62, 90, 118], // Version 27
  [6, 26, 50, 74, 98, 122], // Version 28
  [6, 30, 54, 78, 102, 126], // Version 29
  [6, 26, 52, 78, 104, 130], // Version 30
  [6, 30, 56, 82, 108, 134], // Version 31
  [6, 34, 60, 86, 112, 138], // Version 32
  [6, 30, 58, 86, 114, 142], // Version 33
  [6, 34, 62, 90, 118, 146], // Version 34
  [6, 30, 54, 78, 102, 126, 150], // Version 35
  [6, 24, 50, 76, 102, 128, 154], // Version 36
  [6, 28, 54, 80, 106, 132, 158], // Version 37
  [6, 32, 58, 84, 110, 136, 162], // Version 38
  [6, 26, 54, 82, 110, 138, 166], // Version 39
  [6, 30, 58, 86, 114, 142, 170], // Version 40
];

/**
 * QRVerity Structural Region Map Implementation.
 * Derives geometric module roles independently from QR version specifications.
 */
export class QrStructureMapImpl implements QrStructureMap {
  public readonly size: number;
  public readonly version: number;

  private readonly roles: Uint8Array;

  // Internal role codes for performance
  private static readonly ROLE_DATA = 0;
  private static readonly ROLE_FINDER = 1;
  private static readonly ROLE_SEPARATOR = 2;
  private static readonly ROLE_TIMING = 3;
  private static readonly ROLE_ALIGNMENT = 4;
  private static readonly ROLE_FORMAT = 5;
  private static readonly ROLE_VERSION = 6;
  private static readonly ROLE_DARK_MODULE = 7;

  private static readonly ROLE_NAMES: ReadonlyArray<QrModuleRole> = [
    'data',
    'finder',
    'separator',
    'timing',
    'alignment',
    'format',
    'version',
    'dark-module',
  ];

  constructor(version: number) {
    if (version < 1 || version > 40) {
      throw new RangeError(`Invalid QR version: ${version}. Must be between 1 and 40.`);
    }

    this.version = version;
    this.size = version * 4 + 17;
    this.roles = new Uint8Array(this.size * this.size);

    this.computeRoles();
  }

  public roleAt(x: number, y: number): QrModuleRole {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
      throw new RangeError(`Coordinate out of bounds: (${x}, ${y}) for matrix size ${this.size}`);
    }
    const code = this.roles[y * this.size + x]!;
    return QrStructureMapImpl.ROLE_NAMES[code]!;
  }

  public isProtected(x: number, y: number): boolean {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
      throw new RangeError(`Coordinate out of bounds: (${x}, ${y}) for matrix size ${this.size}`);
    }
    return this.roles[y * this.size + x] !== QrStructureMapImpl.ROLE_DATA;
  }

  private setRole(x: number, y: number, roleCode: number): void {
    this.roles[y * this.size + x] = roleCode;
  }

  private computeRoles(): void {
    const s = this.size;

    // 1. Finder Patterns (7x7 at 3 corners)
    this.fillSquare(0, 0, 7, 7, QrStructureMapImpl.ROLE_FINDER);
    this.fillSquare(s - 7, 0, 7, 7, QrStructureMapImpl.ROLE_FINDER);
    this.fillSquare(0, s - 7, 7, 7, QrStructureMapImpl.ROLE_FINDER);

    // 2. Finder Separators (1-module border around finders)
    // Top-Left Separator
    for (let i = 0; i < 8; i++) {
      this.setRole(7, i, QrStructureMapImpl.ROLE_SEPARATOR);
      this.setRole(i, 7, QrStructureMapImpl.ROLE_SEPARATOR);
    }
    // Top-Right Separator
    for (let i = 0; i < 8; i++) {
      this.setRole(s - 8, i, QrStructureMapImpl.ROLE_SEPARATOR);
      this.setRole(s - 8 + i, 7, QrStructureMapImpl.ROLE_SEPARATOR);
    }
    // Bottom-Left Separator
    for (let i = 0; i < 8; i++) {
      this.setRole(7, s - 8 + i, QrStructureMapImpl.ROLE_SEPARATOR);
      this.setRole(i, s - 8, QrStructureMapImpl.ROLE_SEPARATOR);
    }

    // 3. Timing Patterns (row 6 and column 6 between finders)
    for (let x = 8; x <= s - 9; x++) {
      this.setRole(x, 6, QrStructureMapImpl.ROLE_TIMING);
    }
    for (let y = 8; y <= s - 9; y++) {
      this.setRole(6, y, QrStructureMapImpl.ROLE_TIMING);
    }

    // 4. Format Information Areas
    // Top-Left Format Modules
    for (let x = 0; x <= 5; x++) this.setRole(x, 8, QrStructureMapImpl.ROLE_FORMAT);
    this.setRole(7, 8, QrStructureMapImpl.ROLE_FORMAT);
    this.setRole(8, 8, QrStructureMapImpl.ROLE_FORMAT);
    this.setRole(8, 7, QrStructureMapImpl.ROLE_FORMAT);
    for (let y = 0; y <= 5; y++) this.setRole(8, y, QrStructureMapImpl.ROLE_FORMAT);

    // Top-Right Format Modules
    for (let x = s - 8; x <= s - 1; x++) {
      this.setRole(x, 8, QrStructureMapImpl.ROLE_FORMAT);
    }

    // Bottom-Left Format Modules
    for (let y = s - 7; y <= s - 1; y++) {
      this.setRole(8, y, QrStructureMapImpl.ROLE_FORMAT);
    }

    // 5. Version Information Areas (Only for version >= 7)
    if (this.version >= 7) {
      // Bottom-Left Version Block (3 rows x 6 columns: x in [0..5], y in [s-11..s-9])
      this.fillSquare(0, s - 11, 6, 3, QrStructureMapImpl.ROLE_VERSION);

      // Top-Right Version Block (6 rows x 3 columns: x in [s-11..s-9], y in [0..5])
      this.fillSquare(s - 11, 0, 3, 6, QrStructureMapImpl.ROLE_VERSION);
    }

    // 6. Fixed Dark Module at (8, s - 8)
    this.setRole(8, s - 8, QrStructureMapImpl.ROLE_DARK_MODULE);

    // 7. Alignment Patterns (Versions 2..40)
    const centers = ALIGNMENT_PATTERN_CENTERS[this.version];
    if (centers && centers.length > 0) {
      for (const cx of centers) {
        for (const cy of centers) {
          // Skip alignment patterns that overlap finder / separator regions (0..7)
          if (cx <= 7 && cy <= 7) continue; // Top-Left
          if (cx >= s - 8 && cy <= 7) continue; // Top-Right
          if (cx <= 7 && cy >= s - 8) continue; // Bottom-Left

          // Fill 5x5 alignment pattern centered at (cx, cy)
          this.fillSquare(cx - 2, cy - 2, 5, 5, QrStructureMapImpl.ROLE_ALIGNMENT);
        }
      }
    }
  }

  private fillSquare(x0: number, y0: number, w: number, h: number, roleCode: number): void {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        this.roles[y * this.size + x] = roleCode;
      }
    }
  }
}

/**
 * Factory function to create a QrStructureMap for a given version (1..40).
 */
export function createStructureMap(version: number): QrStructureMap {
  return new QrStructureMapImpl(version);
}
