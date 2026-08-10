import { calculateContrastRatio } from '../render/colors';
import { ReliabilityIssue, ReliabilityResult, VerificationAttempt } from './types';

/**
 * QRVerity Deterministic Reliability Evaluator
 *
 * Evaluates empirical decode facts and rule-based quality heuristics.
 *
 * Rules:
 *
 * RISKY if:
 *   1. jsQR completed but could not decode the rendered raster (DECODE_FAILED).
 *   2. jsQR decoded a QR but content does not match canonical payload (PAYLOAD_MISMATCH).
 *   3. Color contrast ratio between foreground and background is extremely low (< 3.0:1) (LOW_CONTRAST).
 *
 * CAUTION if:
 *   - Decode succeeds and payload matches 100%, BUT:
 *     - Color contrast ratio is moderately low (3.0:1 to < 4.5:1) (MODERATE_CONTRAST).
 *
 * GOOD if:
 *   - Decode succeeds, payload matches 100%, contrast >= 4.5:1, and no risk heuristics apply.
 */
export function evaluateReliability(
  attempt: VerificationAttempt,
  foregroundHex?: string,
  backgroundHex?: string
): ReliabilityResult {
  const issues: ReliabilityIssue[] = [];

  // Rule 1: Decode failure
  if (!attempt.decodeSucceeded) {
    issues.push({
      code: 'DECODE_FAILED',
      severity: 'risk',
      message: `QRVerity could not decode this rendered QR at the tested size (${attempt.actualSizePx} px).`,
    });

    return {
      status: 'RISKY',
      attempts: [attempt],
      issues,
    };
  }

  // Rule 2: Payload mismatch
  if (!attempt.payloadMatches) {
    issues.push({
      code: 'PAYLOAD_MISMATCH',
      severity: 'risk',
      message: 'The decoded QR content did not exactly match the content that was encoded.',
    });

    return {
      status: 'RISKY',
      attempts: [attempt],
      issues,
    };
  }

  // Rule 3: Color contrast heuristic evaluation (if colors provided)
  if (foregroundHex && backgroundHex) {
    try {
      const contrast = calculateContrastRatio(foregroundHex, backgroundHex);

      if (contrast < 3.0) {
        issues.push({
          code: 'LOW_CONTRAST',
          severity: 'risk',
          message: `Contrast is ${contrast.toFixed(1)}:1, below QRVerity's conservative heuristic threshold.`,
        });

        return {
          status: 'RISKY',
          attempts: [attempt],
          issues,
        };
      }

      if (contrast < 4.5) {
        issues.push({
          code: 'MODERATE_CONTRAST',
          severity: 'caution',
          message: `Contrast is ${contrast.toFixed(1)}:1, below QRVerity's conservative strong-contrast heuristic.`,
        });

        return {
          status: 'CAUTION',
          attempts: [attempt],
          issues,
        };
      }
    } catch {
      // Ignore color parsing errors if hex is invalid
    }
  }

  // All checks passed cleanly
  issues.push({
    code: 'DECODE_SUCCESS',
    severity: 'info',
    message: 'Rendered QR decoded successfully and matched the encoded content.',
  });

  return {
    status: 'GOOD',
    attempts: [attempt],
    issues,
  };
}
