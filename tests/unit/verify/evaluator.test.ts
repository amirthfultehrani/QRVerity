import { describe, expect, it } from 'vitest';
import { evaluateReliability } from '../../../src/verify/evaluator';
import { VerificationAttempt } from '../../../src/verify/types';

describe('Reliability Evaluator — Deterministic Rules', () => {
  it('returns GOOD when decode succeeds and payload matches exactly', () => {
    const attempt: VerificationAttempt = {
      requestedSizePx: 512,
      actualSizePx: 493,
      pixelsPerModule: 17,
      decodeSucceeded: true,
      decodedText: 'https://example.com',
      payloadMatches: true,
    };

    const result = evaluateReliability(attempt);

    expect(result.status).toBe('GOOD');
    expect(result.attempts).toHaveLength(1);
    expect(result.attempts[0]).toEqual(attempt);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]!.code).toBe('DECODE_SUCCESS');
    expect(result.issues[0]!.severity).toBe('info');
  });

  it('returns RISKY with DECODE_FAILED when jsQR cannot decode', () => {
    const attempt: VerificationAttempt = {
      requestedSizePx: 512,
      actualSizePx: 493,
      pixelsPerModule: 17,
      decodeSucceeded: false,
      decodedText: null,
      payloadMatches: false,
    };

    const result = evaluateReliability(attempt);

    expect(result.status).toBe('RISKY');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]!.code).toBe('DECODE_FAILED');
    expect(result.issues[0]!.severity).toBe('risk');
    expect(result.issues[0]!.message).toContain('could not decode');
    expect(result.issues[0]!.message).toContain('493');
  });

  it('returns RISKY with PAYLOAD_MISMATCH when decoded text differs', () => {
    const attempt: VerificationAttempt = {
      requestedSizePx: 512,
      actualSizePx: 493,
      pixelsPerModule: 17,
      decodeSucceeded: true,
      decodedText: 'https://wrong-domain.com',
      payloadMatches: false,
    };

    const result = evaluateReliability(attempt);

    expect(result.status).toBe('RISKY');
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]!.code).toBe('PAYLOAD_MISMATCH');
    expect(result.issues[0]!.severity).toBe('risk');
    expect(result.issues[0]!.message).toContain('did not exactly match');
  });
});
