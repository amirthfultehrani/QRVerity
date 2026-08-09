/**
 * PureQR Logo Subsystem Domain Types
 */

export interface LogoValidationLimits {
  readonly maxFileSizeBytes: number; // 5 MB
  readonly maxDimensionPx: number; // 4096 px
  readonly maxPixels: number; // 16 Megapixels (16,000,000)
}

export const DEFAULT_LOGO_LIMITS: LogoValidationLimits = {
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxDimensionPx: 4096,
  maxPixels: 16000000,
};

export interface SafeLogoBounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
  readonly widthModules: number;
  readonly heightModules: number;
  readonly occludedDataModules: number;
  readonly totalDataModules: number;
  readonly coverageRatio: number;
  readonly isClamped: boolean;
  readonly effectiveScale: number;
}
