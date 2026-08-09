import { describe, expect, it, vi } from 'vitest';
import { VerificationClient } from '../../../src/verify/client';
import { VerificationWorkerResponse } from '../../../src/verify/types';

interface InternalClient {
  currentRequestId: number;
  handleWorkerResponse: (response: VerificationWorkerResponse) => void;
}

const asInternal = (client: VerificationClient): InternalClient =>
  client as unknown as InternalClient;

describe('Verification Client & Worker Protocol', () => {
  it('handles worker error response as execution error without RISKY status', () => {
    const client = new VerificationClient();
    const listener = vi.fn();
    client.onStateChange(listener);

    // Simulate worker onmessage with error response
    const mockErrorResponse: VerificationWorkerResponse = {
      id: asInternal(client).currentRequestId,
      kind: 'error',
      error: "PureQR couldn't complete rendered-output verification.",
    };

    asInternal(client).handleWorkerResponse(mockErrorResponse);

    const state = client.getState();
    expect(state.executionState).toBe('error');
    expect(state.reliability).toBeNull();
    expect(state.errorMessage).toBe("PureQR couldn't complete rendered-output verification.");

    client.destroy();
  });

  it('ignores stale worker result or error responses from previous request IDs', () => {
    const client = new VerificationClient();
    const initialState = client.getState();
    const currentId = asInternal(client).currentRequestId;

    // Simulate stale response with obsolete request ID
    const staleResponse: VerificationWorkerResponse = {
      id: currentId - 1,
      kind: 'error',
      error: 'Stale error',
    };

    asInternal(client).handleWorkerResponse(staleResponse);

    // State must remain completely unchanged
    expect(client.getState()).toEqual(initialState);

    client.destroy();
  });

  it('prevents obsolete worker responses from modifying state after invalidation', () => {
    const client = new VerificationClient();
    const initialId = asInternal(client).currentRequestId;

    // Invalidate increments currentRequestId and sets executionState to idle
    client.invalidate();
    expect(client.getState().executionState).toBe('idle');

    // Worker response from pre-invalidation request ID arrives
    const obsoleteResponse: VerificationWorkerResponse = {
      id: initialId,
      kind: 'result',
      attempt: {
        requestedSizePx: 512,
        actualSizePx: 512,
        pixelsPerModule: 16,
        decodeSucceeded: false,
        decodedText: null,
        payloadMatches: false,
      },
      reliability: {
        status: 'RISKY',
        attempts: [],
        issues: [{ code: 'DECODE_FAILED', severity: 'risk', message: 'Failed' }],
      },
    };

    asInternal(client).handleWorkerResponse(obsoleteResponse);

    // Obsolete result ignored, state remains idle
    expect(client.getState().executionState).toBe('idle');
    expect(client.getState().reliability).toBeNull();

    client.destroy();
  });
});
