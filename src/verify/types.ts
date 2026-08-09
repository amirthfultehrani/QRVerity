/**
 * PureQR Verification Domain Types
 *
 * Defines the verification pipeline, reliability model, and worker protocol types.
 * Execution state (idle/pending/complete/error/unavailable) is kept strictly separate
 * from domain reliability outcomes (GOOD/CAUTION/RISKY).
 */

import { EccLevel } from '../qr/types';

// ──────────────────────────────────────────────────
// Domain Reliability Model
// ──────────────────────────────────────────────────

export type ReliabilityStatus = 'GOOD' | 'CAUTION' | 'RISKY';

export type VerificationExecutionState = 'idle' | 'pending' | 'complete' | 'unavailable' | 'error';

export interface DecodeResult {
  readonly succeeded: boolean;
  readonly decodedText: string | null;
}

export interface VerificationAttempt {
  readonly requestedSizePx: number;
  readonly actualSizePx: number;
  readonly pixelsPerModule: number;
  readonly decodeSucceeded: boolean;
  readonly decodedText: string | null;
  readonly payloadMatches: boolean;
}

export interface ReliabilityIssue {
  readonly code: string;
  readonly severity: 'info' | 'caution' | 'risk';
  readonly message: string;
}

export interface ReliabilityResult {
  readonly status: ReliabilityStatus;
  readonly attempts: readonly VerificationAttempt[];
  readonly issues: readonly ReliabilityIssue[];
}

// ──────────────────────────────────────────────────
// Verification UI State (Composite)
// ──────────────────────────────────────────────────

export interface VerificationState {
  readonly executionState: VerificationExecutionState;
  readonly reliability: ReliabilityResult | null;
  readonly errorMessage: string | null;
}

// ──────────────────────────────────────────────────
// Worker Protocol
// ──────────────────────────────────────────────────

export interface VerificationWorkerRequest {
  readonly id: number;
  readonly width: number;
  readonly height: number;
  readonly rgbaBuffer: ArrayBuffer;
  readonly canonicalPayload: string;
  readonly requestedSizePx: number;
  readonly actualSizePx: number;
  readonly pixelsPerModule: number;
  readonly quietZoneModules: number;
  readonly ecc: EccLevel;
  readonly foregroundHex?: string;
  readonly backgroundHex?: string;
}

export type VerificationWorkerResponse =
  | {
      readonly id: number;
      readonly kind: 'result';
      readonly attempt: VerificationAttempt;
      readonly reliability: ReliabilityResult;
    }
  | {
      readonly id: number;
      readonly kind: 'error';
      readonly error: string;
    };
