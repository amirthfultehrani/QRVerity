/**
 * QRVerity Render Domain Types & Interfaces
 *
 * Immutable types for SVG rendering options, logo assets, appearance choices,
 * rendering results, and rasterization options.
 */

export type QrModuleShape = 'square';

export type DataModuleStyle = 'square' | 'rounded' | 'dot';

export type FinderStyle = 'square' | 'rounded';

export interface QrLogoAsset {
  readonly dataUrl: string;
  readonly width: number;
  readonly height: number;
  readonly mimeType: string;
  readonly filename: string;
}

export interface QrRenderOptions {
  foreground: string;
  background: string;
  quietZoneModules: number;
  dataModuleStyle?: DataModuleStyle;
  finderStyle?: FinderStyle;
  logo?: QrLogoAsset | null;
  logoScale?: number; // 0.05 to 0.20
  logoPaddingModules?: number;
}

export interface QrRenderResult {
  svg: string;
  matrixSize: number;
  quietZoneModules: number;
  totalModules: number;
  foreground: string;
  background: string;
  dataModuleStyle: DataModuleStyle;
  finderStyle: FinderStyle;
  hasLogo: boolean;
  effectiveLogoScale: number;
}

export interface RasterizeOptions {
  requestedSizePx: number;
}

export interface RasterizedQr {
  canvasSizePx: number;
  pixelsPerModule: number;
  imageData: ImageData;
}
