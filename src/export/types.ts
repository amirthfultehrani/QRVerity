export type ExportFormat = 'svg' | 'png' | 'jpeg' | 'webp';

export type ImageSizePreset = 256 | 512 | 1024 | 2048;

export interface SvgExportResult {
  readonly blob: Blob;
  readonly filename: string;
}

export interface ImageExportResult {
  readonly blob: Blob;
  readonly filename: string;
  readonly requestedSizePx: number;
  readonly actualSizePx: number;
  readonly pixelsPerModule: number;
}
