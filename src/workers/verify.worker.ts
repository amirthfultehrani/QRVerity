import { decodeQrFromPixels } from '../verify/decode';
import { evaluateReliability } from '../verify/evaluator';
import {
  VerificationAttempt,
  VerificationWorkerRequest,
  VerificationWorkerResponse,
} from '../verify/types';

self.onmessage = (event: MessageEvent<VerificationWorkerRequest>) => {
  const request = event.data;

  try {
    // Reconstruct pixel data from transferred ArrayBuffer
    const pixelData = new Uint8ClampedArray(request.rgbaBuffer);

    // Decode using PureQR's jsQR wrapper (inversionAttempts: 'dontInvert')
    const decodeResult = decodeQrFromPixels(pixelData, request.width, request.height);

    // Strict payload comparison (no normalization, no trimming)
    const payloadMatches =
      decodeResult.succeeded && decodeResult.decodedText === request.canonicalPayload;

    const attempt: VerificationAttempt = {
      requestedSizePx: request.requestedSizePx,
      actualSizePx: request.actualSizePx,
      pixelsPerModule: request.pixelsPerModule,
      decodeSucceeded: decodeResult.succeeded,
      decodedText: decodeResult.decodedText,
      payloadMatches,
    };

    // Evaluate reliability using pure deterministic rules and color contrast heuristics
    const reliability = evaluateReliability(attempt, request.foregroundHex, request.backgroundHex);

    const response: VerificationWorkerResponse = {
      id: request.id,
      kind: 'result',
      attempt,
      reliability,
    };

    self.postMessage(response);
  } catch {
    const response: VerificationWorkerResponse = {
      id: request.id,
      kind: 'error',
      error: "PureQR couldn't complete rendered-output verification.",
    };

    self.postMessage(response);
  }
};
