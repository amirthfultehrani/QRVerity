# 0009. Rendered-Output Optical Verification Subsystem

This document specifies QRVerity's optical verification architecture, Web Worker execution pipeline, jsQR decoder integration, and Predicted Reliability evaluator.

---

## 1. Core Architectural Principle

> [!IMPORTANT]
> **HARD INVARIANT: Empirical Optical Verification.**
>
> Verification MUST inspect the final rendered visual output rather than assuming encoder success.
>
> `canonical payload` → `encodeQr()` → `QrMatrix` → `renderQrSvg()` → `rasterizeQrSvg()` → `ImageData` → `Web Worker` → `jsQR` → `exact string comparison` → `Predicted Reliability`

---

## 2. Product Language & Non-Guarantee Policy

QRVerity NEVER guarantees physical camera scannability. The product explicitly avoids misleading claims such as "100% Verified", "Guaranteed Scannable", or "100% Reliable".

- **User-Facing Label**: `Predicted Reliability`
- **Domain Statuses**: `GOOD`, `CAUTION`, `RISKY`
- **Explanatory Copy**: _"Predicted Reliability tests this rendered QR in your browser. It does not guarantee scanning with every camera, printer, screen, or environment."_

---

## 3. Dependency & Decoder Wrapper

- **Library**: `jsqr` version `1.4.0` (Apache-2.0 License).
- **Types**: Ships TypeScript declarations directly (`dist/index.d.ts`). No separate `@types/jsqr` package is installed.
- **Isolation Wrapper**: [src/verify/decode.ts](file:///c:/Users/gamin/Downloads/QR%20Code%20Generating%20Project/src/verify/decode.ts) wraps `jsQR`. No UI component or domain module imports `jsQR` directly.
- **Inversion Policy**: Calls `jsQR(data, width, height, { inversionAttempts: 'dontInvert' })`. QRVerity renders standard dark modules on a light background. Setting `dontInvert` eliminates wasted CPU attempts and strictly validates standard optical polarity.

---

## 4. Worker Execution Protocol

- **Main Thread**: Waits for 200ms input debounce, calls `rasterizeQrSvg(svg, { requestedSizePx: 512 })`, obtains `ImageData`, transfers raw pixel buffer (`ArrayBuffer`) to worker, and manages stale request filtering.
- **Web Worker** ([src/workers/verify.worker.ts](file:///c:/Users/gamin/Downloads/QR%20Code%20Generating%20Project/src/workers/verify.worker.ts)): Reconstructs Uint8ClampedArray from transferred buffer, invokes `decodeQrFromPixels`, performs strict string equality comparison (`decodedText === canonicalPayload`), runs `evaluateReliability`, and posts response back.

```ts
// Request Protocol
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
}

// Response Protocol
export interface VerificationWorkerResponse {
  readonly id: number;
  readonly attempt: VerificationAttempt;
  readonly reliability: ReliabilityResult;
}
```

---

## 5. Stale Job Cancellation & Sequence IDs

- The main-thread client maintains a monotonically increasing `currentRequestId` counter.
- Each verification request increments `currentRequestId`.
- When a response returns from the worker, the client validates `if (response.id !== currentRequestId) return;`. Stale worker responses from superseded typing states are immediately discarded.
- Form invalidation or empty input resets state to `idle` and increments `currentRequestId`.

---

## 6. Execution State vs. Domain Reliability Separation

- `PENDING` is an execution state, NOT a reliability result.
- `ERROR` or `UNAVAILABLE` are execution states, NOT `RISKY`.
- `GOOD`, `CAUTION`, and `RISKY` exist ONLY after a successful optical decode attempt returns facts.

---

## 7. Deterministic Reliability Rules

QRVerity rejects arbitrary 0–100 scores in favor of deterministic rule evaluation:

- **RISKY**:
  - `DECODE_FAILED`: `jsQR` completed normally but returned null (unable to decode raster).
  - `PAYLOAD_MISMATCH`: `jsQR` decoded a QR code, but `decodedText !== canonicalPayload`.
- **GOOD**:
  - Optical scan succeeded, payload matches 100%, quiet zone $\ge 4$, contrast $\ge 4.5:1$, no active warning.

---

## 8. Local Privacy Guarantee

All verification runs 100% locally in browser memory via Web Worker. Decoded text and pixel buffers are never transmitted over the network or logged to external services.
