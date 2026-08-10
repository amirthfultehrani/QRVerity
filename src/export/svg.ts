import { PayloadType } from '../payloads/types';
import { generateExportFilename } from './filename';
import { SvgExportResult } from './types';

/**
 * Creates an SVG Blob and safe filename from canonical rendered SVG string.
 */
export function exportQrSvg(svg: string, payloadType: PayloadType): SvgExportResult {
  if (typeof svg !== 'string' || svg.trim().length === 0) {
    throw new Error('Invalid SVG input for export');
  }

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const filename = generateExportFilename(payloadType, 'svg');

  return { blob, filename };
}

/**
 * Triggers a client-side file download for a Blob using a temporary anchor element.
 * Revokes the Object URL cleanly to avoid memory leaks.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('downloadBlob requires a browser DOM environment');
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';

  document.body.appendChild(a);
  try {
    a.click();
  } finally {
    document.body.removeChild(a);
    // Microtask revocation ensures download triggers before revocation
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }
}
