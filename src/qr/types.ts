/**
 * QRVerity Core Types & Interfaces
 *
 * Immutable domain models for QR matrix geometry, metadata, options,
 * and structural region classification.
 */

export type EccLevel = 'L' | 'M' | 'Q' | 'H';

export type QrModuleRole =
  'data' | 'finder' | 'separator' | 'timing' | 'alignment' | 'format' | 'version' | 'dark-module';

export interface QrEncodingOptions {
  ecc: EccLevel;
  minVersion?: number;
  maxVersion?: number;
  mask?: number;
  boostEcc?: boolean;
}

export interface QrMetadata {
  readonly version: number;
  readonly size: number;
  readonly ecc: EccLevel;
  readonly mask: number;
}

export interface QrMatrix {
  readonly size: number;
  readonly version: number;
  readonly ecc: EccLevel;
  readonly mask: number;

  /**
   * Returns whether the module at (x, y) is dark (true) or light (false).
   * Top-left origin (0, 0), x increases rightward, y increases downward.
   * Throws RangeError if (x, y) is outside matrix bounds [0, size).
   */
  isDark(x: number, y: number): boolean;
}

export interface QrStructureMap {
  readonly size: number;
  readonly version: number;

  /**
   * Returns the structural role of the module at coordinate (x, y).
   * Throws RangeError if (x, y) is outside matrix bounds [0, size).
   */
  roleAt(x: number, y: number): QrModuleRole;

  /**
   * Returns true for any structural region role other than 'data'.
   * Protected regions MUST NOT be overwritten or corrupted by styling/logos.
   * Throws RangeError if (x, y) is outside matrix bounds [0, size).
   */
  isProtected(x: number, y: number): boolean;
}
