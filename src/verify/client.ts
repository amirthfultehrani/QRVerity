import { EccLevel } from '../qr/types';
import { rasterizeQrSvg } from '../render/raster/rasterize';
import { QrRenderResult } from '../render/types';
import { VerificationState, VerificationWorkerRequest, VerificationWorkerResponse } from './types';

const VERIFICATION_SIZE_PX = 512;
const DEBOUNCE_DELAY_MS = 200;

export type VerificationStateListener = (state: VerificationState) => void;

export class VerificationClient {
  private worker: Worker | null = null;
  private currentRequestId = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private listener: VerificationStateListener | null = null;
  private currentState: VerificationState = {
    executionState: 'idle',
    reliability: null,
    errorMessage: null,
  };
  private workerAvailable = true;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    try {
      this.worker = new Worker(new URL('../workers/verify.worker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (event: MessageEvent<VerificationWorkerResponse>) => {
        this.handleWorkerResponse(event.data);
      };

      this.worker.onerror = () => {
        this.workerAvailable = false;
        this.updateState({
          executionState: 'unavailable',
          reliability: null,
          errorMessage: 'Rendered-output verification is unavailable in this browser.',
        });
      };
    } catch {
      this.workerAvailable = false;
      this.updateState({
        executionState: 'unavailable',
        reliability: null,
        errorMessage: 'Rendered-output verification is unavailable in this browser.',
      });
    }
  }

  onStateChange(listener: VerificationStateListener): void {
    this.listener = listener;
  }

  getState(): VerificationState {
    return this.currentState;
  }

  requestVerification(
    renderResult: QrRenderResult,
    canonicalPayload: string,
    ecc: EccLevel,
    quietZoneModules: number
  ): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.currentRequestId++;

    if (!this.workerAvailable || !this.worker) {
      this.updateState({
        executionState: 'unavailable',
        reliability: null,
        errorMessage: 'Rendered-output verification is unavailable in this browser.',
      });
      return;
    }

    this.updateState({
      executionState: 'pending',
      reliability: null,
      errorMessage: null,
    });

    this.debounceTimer = setTimeout(() => {
      this.executeVerification(renderResult, canonicalPayload, ecc, quietZoneModules);
    }, DEBOUNCE_DELAY_MS);
  }

  invalidate(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.currentRequestId++;

    this.updateState({
      executionState: 'idle',
      reliability: null,
      errorMessage: null,
    });
  }

  destroy(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.listener = null;
  }

  private async executeVerification(
    renderResult: QrRenderResult,
    canonicalPayload: string,
    ecc: EccLevel,
    quietZoneModules: number
  ): Promise<void> {
    const requestId = this.currentRequestId;

    try {
      const rasterized = await rasterizeQrSvg(renderResult.svg, {
        requestedSizePx: VERIFICATION_SIZE_PX,
      });

      if (requestId !== this.currentRequestId) return;

      const buffer = rasterized.imageData.data.buffer.slice(0);

      const request: VerificationWorkerRequest = {
        id: requestId,
        width: rasterized.canvasSizePx,
        height: rasterized.canvasSizePx,
        rgbaBuffer: buffer,
        canonicalPayload,
        requestedSizePx: VERIFICATION_SIZE_PX,
        actualSizePx: rasterized.canvasSizePx,
        pixelsPerModule: rasterized.pixelsPerModule,
        quietZoneModules,
        ecc,
        foregroundHex: renderResult.foreground,
        backgroundHex: renderResult.background,
      };

      this.worker!.postMessage(request, [request.rgbaBuffer]);
    } catch (err: unknown) {
      if (requestId !== this.currentRequestId) return;

      const message = err instanceof Error ? err.message : 'Rasterization failed';
      this.updateState({
        executionState: 'error',
        reliability: null,
        errorMessage: `PureQR couldn't prepare this QR for verification: ${message}`,
      });
    }
  }

  private handleWorkerResponse(response: VerificationWorkerResponse): void {
    if (response.id !== this.currentRequestId) return;

    if (response.kind === 'error') {
      this.updateState({
        executionState: 'error',
        reliability: null,
        errorMessage: response.error,
      });
      return;
    }

    this.updateState({
      executionState: 'complete',
      reliability: response.reliability,
      errorMessage: null,
    });
  }

  private updateState(state: VerificationState): void {
    this.currentState = state;
    if (this.listener) {
      this.listener(state);
    }
  }
}
