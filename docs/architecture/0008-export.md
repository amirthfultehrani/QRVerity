# 0008. Canonical Export Engine & Clipboard Subsystem

This document specifies QRVerity's export architecture, pixel-snapped PNG rasterization export, safe filename privacy rules, and clipboard feature detection.

---

## 1. Core Export Architecture Invariants

> [!IMPORTANT]
> **HARD INVARIANT: Single Canonical Visual Source.**
>
> 1. **SVG Export**: Uses `QrRenderResult.svg` directly without mutation or secondary rendering.
> 2. **PNG Export**: Rasterizes the exact same canonical SVG via `rasterizeQrSvg()` from `src/render/raster/rasterize.ts`.
> 3. **Clipboard Image**: Derives directly from the PNG rasterization pipeline (`exportQrPng`).
> 4. **No Secondary Renderer**: Export modules MUST NEVER independently recalculate QR geometry or redraw modules from a `QrMatrix`. Canvas remains strictly a downstream rasterization target.

---

## 2. Safe Filename Privacy Policy

To protect user privacy and prevent sensitive payload leaks (e.g. Wi-Fi passwords, email body content, contact notes):

- **Zero Payload Contamination**: Filenames are constructed using ONLY the payload type identifier:
  - `QRVerity-url.svg` / `QRVerity-url.png`
  - `QRVerity-text.svg` / `QRVerity-text.png`
  - `QRVerity-wifi.svg` / `QRVerity-wifi.png`
  - `QRVerity-vcard.svg` / `QRVerity-vcard.png`
  - `QRVerity-calendar.svg` / `QRVerity-calendar.png`
- **Normalization**: Filenames are strictly lowercase, safe ASCII, with zero path separators (`/`, `\`) or control characters.

---

## 3. Pixel-Snapped PNG Export & Dimension Communication

PNG export enforces integer pixel-per-module snapping via `planRasterSize`:

- **Preset Sizes**: 256 px, 512 px, 1024 px (default), 2048 px.
- **Snapping Communication**: Because `pixelsPerModule` must be an integer ($\ge 1$), output canvas dimensions map to $\text{actualSizePx} = \text{pixelsPerModule} \times \text{totalModules}$. The UI explicitly presents the actual snapped output dimensions (`Actual: 1015 × 1015 px`) to the user.

---

## 4. Clipboard Feature Detection & Graceful Degradation

Clipboard APIs vary across browser security contexts and engines:

- **SVG Copy (`copySvgToClipboard`)**: Uses `navigator.clipboard.writeText(svg)`. Feature detected via `isCopyTextSupported()`.
- **PNG Copy (`copyPngToClipboard`)**: Uses `navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])`. Feature detected via `isCopyImageSupported()`.
- **Graceful Failure**: If permission is denied (`NotAllowedError`, `SecurityError`) or the API is unsupported, copy buttons are disabled or display user-friendly feedback without throwing unhandled exceptions or crashing the application.

---

## 5. Privacy Guarantee

- **100% Local File Generation**: All Blob creation, URL Object generation, and canvas rasterization run entirely within the user's browser memory.
- **Zero Network Egress**: File downloads and clipboard operations make zero HTTP requests, network uploads, or analytics telemetry calls.
