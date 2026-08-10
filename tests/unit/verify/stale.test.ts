import { describe, expect, it, vi } from 'vitest';
import { VerificationClient } from '../../../src/verify/client';

describe('Verification Client — Stale Job Handling', () => {
  it('initializes and manages state transitions cleanly', () => {
    const client = new VerificationClient();
    const state = client.getState();

    expect(['idle', 'unavailable']).toContain(state.executionState);

    client.invalidate();
    expect(client.getState().executionState).toBe('idle');

    client.destroy();
  });

  it('notifies state change listeners', () => {
    const client = new VerificationClient();
    const listener = vi.fn();
    client.onStateChange(listener);

    client.invalidate();

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ executionState: 'idle' }));

    client.destroy();
  });
});
