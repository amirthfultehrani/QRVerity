import { PayloadType } from '../payloads/types';
import { ExportFormat } from './types';

/**
 * QRVerity Safe Filename Generator
 *
 * Requirements:
 * - MUST NOT contain user payload text or sensitive credentials.
 * - Uses payload type only (e.g. qrverity-url.svg, qrverity-wifi.png).
 * - Safe ASCII, lowercase, zero path separators or control characters.
 */
export function generateExportFilename(payloadType: PayloadType, format: ExportFormat): string {
  const safeType = typeof payloadType === 'string' ? payloadType.toLowerCase().trim() : 'qr';
  const ext = format === 'png' ? 'png' : 'svg';
  return `qrverity-${safeType}.${ext}`;
}
