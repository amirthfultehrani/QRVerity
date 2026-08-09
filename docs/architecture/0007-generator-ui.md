# 0007. Generator UI Architecture & State Flow

This document details the architecture of QRVerity's generator interface, reactive state model, domain isolation, preview behavior, accessibility guarantees, and privacy invariants.

---

## 1. Domain Isolation & State Model

> [!IMPORTANT]
> **HARD INVARIANT: Pure Domain Data Flow & State Hierarchy.**
>
> 1. **Canonical State**: Only user-controlled inputs (`selectedPayloadType`, `payloadInputs`, `ecc`) are stored as writable state signals.
> 2. **Derived Data**: All QR geometry, validation results, serialized strings, matrices, and SVG output are purely derived computations. No UI component may manually set a QR matrix or SVG string.
> 3. **Zero Domain Logic in UI**: Components edit structured form fields only. Payload validation, escaping, and formatting rules reside strictly in `src/payloads/`.

### Pipeline Execution Flow

```
User Form Input
       │
       ▼
currentSerializer.validate(currentInput)
       │
       ├── INVALID ──> Render field errors & neutral placeholder state
       │
       ▼ VALID
currentSerializer.serialize(normalized)
       │
       ▼
encodeQr(canonicalString, { ecc })
       │
       ▼
createStructureMap(matrix.version)
       │
       ▼
renderQrSvg(matrix, structureMap, renderOptions)
       │
       ▼
Live SVG Preview Element
```

---

## 2. Invalid Input & Error Preview Behavior

- **No Misleading Previews**: Invalid payload inputs do NOT produce or retain a QR preview. If validation fails or the input is empty, the QR preview is replaced by a neutral placeholder state explaining what needs fixing.
- **Capacity Failure Handling**: If validation succeeds but payload size exceeds QR capacity for the selected error correction level, an understandable error message ("This content is too large to fit in a standard QR code at the selected error-correction level.") is rendered without crashing or exposing raw vendor stack traces.

---

## 3. Payload Switching Behavior

- **State Retention**: Switching between payload types (e.g. URL → Wi-Fi → Contact → Calendar) updates `selectedPayloadType` while retaining each payload form's input state independently.
- **No State Leakage**: Switching types resets the active serializer and validation context cleanly so unrelated fields from previously active forms are never serialized into the new payload.

---

## 4. Omission of Reliability Badge in V1 UI

> [!CAUTION]
> **No Fake Reliability Status**: Reliability badges (`GOOD`, `CAUTION`, `RISKY`) are intentionally omitted in Phase 4.
>
> True reliability evaluation requires jsQR decoding verification against actual canvas raster data. Because Web Workers and jsQR verification are introduced in Phase 7, Phase 4 MUST NOT display a false or predicted reliability badge based solely on encoder success.

---

## 5. Accessibility (WCAG 2.2 AA) & Privacy Invariants

### Accessibility Strategy

- **Semantic Form Controls**: Native `<label>`, `<input>`, `<select>`, `<textarea>`, `<fieldset>`, and `<legend>` elements are used throughout.
- **Keyboard & Screen Reader Support**: Payload type selector provides full keyboard navigation (`role="tablist"` / `role="tab"` for desktop and native `<select>` for mobile).
- **Error Association**: Field-level validation messages are linked via `aria-describedby` and marked with `aria-invalid="true"`.
- **Target Sizes & Color Contrast**: Touch targets satisfy minimum 44px dimensions. Color is never the sole medium for communicating errors.

### Privacy Invariant

- **100% Client-Side Processing**: All QR generation logic executes entirely in-browser.
- **Zero Network Egress**: Application code makes zero API calls, telemetry requests, or analytics tracking calls. User payload data is never transmitted over the network.
