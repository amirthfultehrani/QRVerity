# 0002. Data Flow Pipeline

This document details the data flow pipeline for QRVerity generation, pre-download verification, and artifact export.

---

## 1. Generation & Pre-Download Verification Pipeline

```
User Input Fields
       │
       ▼
Validation & Normalization (src/payloads/)
       │
       ▼
Canonical Serialized Payload String
       │
       ▼
Nayuki QR Adapter (src/qr/ — isolated vendor bridge)
       │
       ▼
QrMatrix + Version/ECC Metadata
       │
       ▼
Structural Role Map (protecting finder, timing, alignment, format/version info)
       │
       ▼
Canonical SVG Generator (src/render/)
       │
       ▼
Main-Thread Rasterization (Canvas / OffscreenCanvas -> ImageData)
       │
       ▼
Transferable Pixel Buffer (ArrayBuffer transfer)
       │
       ▼
Web Worker jsQR Decode (src/workers/ & src/verify/)
       │
       ▼
Payload Comparison & Reliability Heuristics
       │
       ▼
Predicted Reliability UI State (GOOD | CAUTION | RISKY)
```

---

## 2. Export Pipeline

### SVG Export Pipeline

```
Canonical SVG Representation
       │
       ▼
SVG Blob Creation & Sanitization Validation
       │
       ▼
Download / Clipboard API (Copy SVG)
```

### PNG Export Pipeline

```
Canonical SVG Representation
       │
       ▼
Pixel-Snapped Rasterization (Integer pixels-per-module snapping)
       │
       ▼
Canvas PNG Export (toDataURL / toBlob)
       │
       ▼
Download / Clipboard API (Copy Image where supported)
```
