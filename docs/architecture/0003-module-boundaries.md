# 0003. Module Boundaries & Import Rules

To ensure long-term maintainability, correctness, and security, QRVerity enforces strict architectural boundaries across directories.

---

## Directory Responsibilities & Import Rules

### `src/payloads/`

- **Responsibility**: Pure domain serialization, validation, and normalization for supported v1 QR payload types (URL, Wi-Fi, vCard, etc.).
- **Restrictions**: ZERO UI dependencies, zero DOM dependencies, zero renderer imports.

### `src/qr/`

- **Responsibility**: QR matrix generation, structural region map calculation, and QR geometry encoding.
- **Restrictions**: ZERO UI dependencies.
- **Vendor Rule**: The single adapter inside `src/qr/` is the ONLY module in the entire codebase permitted to import the vendored Nayuki library (`src/qr/vendor/`).

### `src/render/`

- **Responsibility**: Pure canonical SVG renderer and styling engine.
- **Restrictions**: ZERO Preact dependency. Receives pure domain structures and options; never reads UI state or component state directly.

### `src/verify/`

- **Responsibility**: Pure payload comparison strategies and reliability evaluation heuristics.
- **Restrictions**: ZERO Preact dependency. Operates on decoded payload strings and raster pixel data.

### `src/workers/`

- **Responsibility**: Web Worker entry points running isolated `jsQR` decoding and verification calculations off the main thread.
- **Restrictions**: ZERO Preact dependency, ZERO DOM assumptions (uses WorkerGlobalScope and transferable ArrayBuffers).

### `src/export/`

- **Responsibility**: SVG and PNG file generation, clipboard copying, and download triggers.
- **Restrictions**: Consumes canonical SVG/raster output from renderer. Must NEVER rebuild or re-encode QR geometry independently.

### UI Layers (`src/app/`, `src/components/`, `src/features/`)

- **Responsibility**: Accessible Preact UI components, form controls, layout, and visual feedback.
- **Restrictions**: May consume domain facades. Must NEVER import Nayuki vendored code (`src/qr/vendor/`) or worker internals (`src/workers/`) directly. Enforced via ESLint boundary rules.
