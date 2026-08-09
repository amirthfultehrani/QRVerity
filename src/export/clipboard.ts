/**
 * PureQR Clipboard Helper Engine
 *
 * Provides feature detection and graceful clipboard copying for SVG source code and PNG images.
 */

/**
 * Feature detects whether text clipboard copying (navigator.clipboard.writeText) is supported.
 */
export function isCopyTextSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    Boolean(navigator.clipboard) &&
    typeof navigator.clipboard.writeText === 'function'
  );
}

/**
 * Feature detects whether image clipboard copying (navigator.clipboard.write + ClipboardItem) is supported.
 */
export function isCopyImageSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    Boolean(navigator.clipboard) &&
    typeof navigator.clipboard.write === 'function' &&
    typeof ClipboardItem !== 'undefined'
  );
}

/**
 * Copies canonical SVG source text to system clipboard.
 */
export async function copySvgToClipboard(svg: string): Promise<boolean> {
  if (!isCopyTextSupported()) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(svg);
    return true;
  } catch {
    // Handle NotAllowedError, SecurityError, or unpermitted contexts gracefully
    return false;
  }
}

/**
 * Copies PNG image Blob to system clipboard.
 */
export async function copyPngToClipboard(pngBlob: Blob): Promise<boolean> {
  if (!isCopyImageSupported()) {
    return false;
  }

  try {
    const item = new ClipboardItem({ 'image/png': pngBlob });
    await navigator.clipboard.write([item]);
    return true;
  } catch {
    return false;
  }
}
