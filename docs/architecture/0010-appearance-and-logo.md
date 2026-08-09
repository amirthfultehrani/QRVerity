# 0010. Structurally Safe Appearance Controls & Logo Subsystem

This document specifies PureQR's Phase 7 appearance customization controls, data-only module styling, finder safety boundaries, local raster logo sanitization, and safe logo geometry clamping.

---

## 1. Non-Negotiable Structural Safety Invariant

> [!IMPORTANT]
> **HARD INVARIANT: Zero Protected Module Modification or Occlusion.**
>
> Protected QR modules (`finder`, `separator`, `timing`, `alignment`, `format`, `version`, `dark-module`) MUST NEVER be altered, hidden, clipped, recolored independently, rounded into unsafe geometry, or occluded by a logo.
>
> 1. Decorative module shape styling (`square`, `rounded`, `dot`) applies ONLY to modules where `structure.roleAt(x, y) === 'data'`.
> 2. Protected non-finder modules render strictly as conservative 1×1 squares.
> 3. Logo image footprint AND logo background padding MUST avoid 100% of protected modules (`structure.isProtected(x, y) === false`).

---

## 2. Safe Logo Sanitization & Metadata Stripping

To protect security and user privacy:

- **Supported Formats**: PNG, JPEG, WebP.
- **Forbidden Formats**: SVG logos are strictly rejected (to prevent XML external entity attacks, script injection, and foreignObject exploits).
- **Safety Limits**: Maximum file size 5 MB, maximum dimensions 4096 × 4096 px, maximum resolution 16 megapixels.
- **Local Re-rasterization**: Logo files are loaded into an offscreen browser Canvas and re-exported as clean PNG data URLs (`toDataURL('image/png')`). Original file bytes, EXIF metadata, IPTC headers, and GPS tags are completely stripped before embedding.
- **Zero Network Transmission**: Logo processing occurs 100% locally in browser memory.

---

## 3. Logo ECC H Policy & Safe Geometry Clamping

- **Pre-Encoding ECC H Enforcement**: Whenever a logo is present, Error Correction Level is automatically forced to **H BEFORE QR encoding** (`encodeQr`). Nayuki allocates the required matrix version based on high error correction (28%–30% recovery margin) before safe logo geometry is derived.
- **Center-Placed Footprint Clamping**: Logo size is requested via slider (5% to 20%). `calculateSafeLogoBounds` computes the candidate logo footprint + padding box. If the footprint intersects ANY protected module coordinate, the footprint is automatically shrunk to the largest safe centered box.

---

## 4. Single Canonical SVG Pipeline Integration

- Preview, SVG download, PNG rasterized download, image clipboard copy, and Web Worker optical verification ALL consume the exact same canonical styled SVG string produced by `renderQrSvg()`.
- If a logo is embedded, the canonical SVG embeds the clean raster logo data URL (`<image href="data:image/png;base64,...">`). Verification rasterizes this complete styled SVG and runs `jsQR` against the actual composite output.

---

## 5. Contrast Heuristics

Color contrast between foreground and background is evaluated using WCAG 2.1 relative luminance:

- **Contrast $< 3.0:1$**: Evaluated as `RISKY` (`LOW_CONTRAST`).
- **$3.0:1 \le \text{Contrast} < 4.5:1$**: Evaluated as `CAUTION` (`MODERATE_CONTRAST`).
- **Contrast $\ge 4.5:1$**: Evaluated as `GOOD` (assuming optical decode and payload match succeed).
