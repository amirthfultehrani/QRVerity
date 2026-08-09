import { qrcodegen } from './vendor/nayuki/qrcodegen';
import { EccLevel, QrEncodingOptions, QrMatrix, QrMetadata } from './types';
import { QrMatrixImpl } from './matrix';
import { QrEncodingError, QrInputError, QrVersionError } from './errors';

/**
 * QRVerity Nayuki Adapter
 *
 * ARCHITECTURE BOUNDARY:
 * This module is the SOLE production module permitted to import Nayuki qrcodegen.
 * It encapsulates all vendor specifics and returns QRVerity-owned QrMatrix and QrMetadata.
 */

const ECC_MAP_TO_NAYUKI: Record<EccLevel, qrcodegen.QrCode.Ecc> = {
  L: qrcodegen.QrCode.Ecc.LOW,
  M: qrcodegen.QrCode.Ecc.MEDIUM,
  Q: qrcodegen.QrCode.Ecc.QUARTILE,
  H: qrcodegen.QrCode.Ecc.HIGH,
};

const NAYUKI_TO_ECC_MAP = new Map<qrcodegen.QrCode.Ecc, EccLevel>([
  [qrcodegen.QrCode.Ecc.LOW, 'L'],
  [qrcodegen.QrCode.Ecc.MEDIUM, 'M'],
  [qrcodegen.QrCode.Ecc.QUARTILE, 'Q'],
  [qrcodegen.QrCode.Ecc.HIGH, 'H'],
]);

export interface QrEncodingResult {
  matrix: QrMatrix;
  metadata: QrMetadata;
}

/**
 * Encodes a string payload into a canonical QrMatrix and metadata.
 */
export function encodeQr(payload: string, options: QrEncodingOptions): QrEncodingResult {
  // 1. Validate ECC
  if (!options || !options.ecc || !(options.ecc in ECC_MAP_TO_NAYUKI)) {
    throw new QrInputError(
      `Invalid ECC level: "${String(options?.ecc)}". Allowed values: 'L', 'M', 'Q', 'H'.`
    );
  }

  const minVersion = options.minVersion ?? 1;
  const maxVersion = options.maxVersion ?? 40;
  const mask = options.mask ?? -1;
  const boostEcc = options.boostEcc ?? false;

  // 2. Validate version bounds
  if (minVersion < 1 || minVersion > 40) {
    throw new QrVersionError(`Invalid minVersion: ${minVersion}. Must be between 1 and 40.`);
  }
  if (maxVersion < 1 || maxVersion > 40) {
    throw new QrVersionError(`Invalid maxVersion: ${maxVersion}. Must be between 1 and 40.`);
  }
  if (minVersion > maxVersion) {
    throw new QrVersionError(
      `minVersion (${minVersion}) cannot be greater than maxVersion (${maxVersion}).`
    );
  }

  // 3. Validate mask bounds
  if (mask < -1 || mask > 7) {
    throw new QrInputError(`Invalid mask: ${mask}. Must be -1 (automatic) or between 0 and 7.`);
  }

  const nayukiEcc = ECC_MAP_TO_NAYUKI[options.ecc];

  try {
    const segments = qrcodegen.QrSegment.makeSegments(payload);
    const qrCode = qrcodegen.QrCode.encodeSegments(
      segments,
      nayukiEcc,
      minVersion,
      maxVersion,
      mask,
      boostEcc
    );

    const actualEcc = NAYUKI_TO_ECC_MAP.get(qrCode.errorCorrectionLevel) ?? options.ecc;
    const size = qrCode.size;

    // Extract module grid into boolean[][]
    const grid: boolean[][] = [];
    for (let y = 0; y < size; y++) {
      const row: boolean[] = [];
      for (let x = 0; x < size; x++) {
        row.push(qrCode.getModule(x, y));
      }
      grid.push(row);
    }

    const matrix = new QrMatrixImpl(qrCode.version, actualEcc, qrCode.mask, grid);

    const metadata: QrMetadata = {
      version: qrCode.version,
      size: qrCode.size,
      ecc: actualEcc,
      mask: qrCode.mask,
    };

    return { matrix, metadata };
  } catch (err: unknown) {
    if (err instanceof RangeError) {
      if (err.message.includes('overflow')) {
        throw new QrEncodingError(
          `Payload too large for version range ${minVersion}..${maxVersion} at ECC ${options.ecc}.`
        );
      }
      throw new QrEncodingError(`QR encoding range error: ${err.message}`);
    }
    if (err instanceof Error) {
      throw new QrEncodingError(`QR encoding failed: ${err.message}`);
    }
    throw new QrEncodingError('QR encoding failed due to an unknown error.');
  }
}
