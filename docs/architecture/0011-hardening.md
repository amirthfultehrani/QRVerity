# 0011. Phase 8 — Security, Accessibility, Browser-Compatibility & Resilience Hardening

## Context & Scope

Phase 8 performs a comprehensive hardening pass on QRVerity prior to final release preparation. Rather than adding new product features or modifying core QR geometry/serialization architectures, Phase 8 reinforces the reliability, security, accessibility, privacy, and cross-browser resilience of the entire application.

## Key Hardening Domains

### 1. Security & Input Sanitization

- **Strict Scheme Allowlist**: The URL serializer permits `http:` and `https:` schemes only. Dangerous or non-http protocols (`javascript:`, `data:`, `vbscript:`, `file:`, `blob:`, `ftp:`) and obfuscation techniques (whitespace/mixed-case tricks) are rejected.
- **Inert Text Serialization**: User payload content (e.g. HTML/script tags in text, vCard, calendar, email fields) is serialized as inert text values. QRVerity never interpolates raw payload content into HTML DOM sinks.
- **Color Format Normalization**: Custom foreground/background color inputs are validated against strict CSS hex regex patterns (`#RGB` and `#RRGGBB`) and normalized into uppercase 6-digit hex format (`#RRGGBB`). Malformed strings and CSS injection payloads are rejected.
- **Safe Self-Contained SVG**: `renderQrSvg()` outputs self-contained SVG vectors free of `<script>`, `<foreignObject>`, `onload=`, `onclick=`, or external HTTP/HTTPS resource links.
- **Sanitized Raster Logos**: Logo processing decodes image inputs locally, re-rasterizes pixels onto a clean HTML Canvas, and outputs a sanitized PNG Data URL (`data:image/png;base64,...`). Original EXIF/IPTC/XMP metadata and raw file bytes are discarded. SVG logo inputs are strictly forbidden.

### 2. Privacy & Zero-Transmission Verification

- QRVerity contains zero application backends, databases, APIs, remote verification services, tracking pixels, or third-party analytics scripts.
- All payload validation, QR matrix encoding, canonical SVG rendering, image sanitization, optical worker verification (`jsQR`), and vector/raster file export execute 100% locally inside the user's browser.
- Production error handlers avoid logging raw error objects or user payload content to developer consoles.

### 3. Content Security Policy (CSP) Baseline

- Configured via a restrictive HTML `<meta>` Content-Security-Policy header:
  ```html
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; object-src 'none'; base-uri 'self'; form-action 'self';"
  />
  ```
- **GitHub Pages Limitation**: GitHub Pages serves static sites and does not support custom HTTP response headers. Consequently, CSP is enforced via `<meta http-equiv="Content-Security-Policy">`. Directives such as `frame-ancestors` are not enforced by browsers when delivered via `<meta>`.

### 4. Accessibility & Mouse-Free Operation

- Enforces WCAG 2.2 AA guidelines:
  - Form fields feature explicit HTML `<label>` associations and aria-describedby error hints.
  - Interactive elements (buttons, inputs, select dropdowns, sliders, radiogroups) possess high-visibility `:focus-visible` focus rings.
  - Active button states enforce WCAG AA text contrast ratio ($\ge 4.5:1$).
  - Range sliders and radio groups support standard keyboard navigation (`Tab`, `Space`, `Arrow` keys).
  - Respects `@media (prefers-reduced-motion: reduce)` by disabling non-essential transitions.

### 5. Async Race Safety & State Resilience

- `handleLogoFileSelect` utilizes in-flight generation token tracking (`useRef`) to ensure that if a user selects a new logo file or removes a logo while a previous image decoding promise is in progress, the stale async result is safely discarded.
- State changes in payload or appearance instantly invalidate prior verification worker results and trigger re-verification.

### 6. Cross-Browser Engine Support

- Configured Playwright cross-browser matrix covering Chromium (Chrome/Edge), Firefox, and WebKit (Safari).
- `createImageBitmap()` decoding incorporates a seamless `FileReader` + `HTMLImageElement` fallback path for browsers or synthetic environments where `createImageBitmap` is unavailable or restricted.
