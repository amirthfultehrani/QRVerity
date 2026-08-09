# QRVerity

> Privacy-first QR generator with rendered-output verification.

QRVerity is a static, client-side web application for generating customizable QR codes with pre-download raster verification.

---

## What QRVerity Does

QRVerity creates custom QR codes directly inside your web browser. Before you download or copy an image, QRVerity rasterizes the exact rendered SVG output and decodes it using an isolated optical decoder (`jsQR`) inside a Web Worker. This provides **Predicted Reliability** feedback so you can be confident your custom styling and logos remain readable.

---

## Why QRVerity Exists

Many online QR generators send your sensitive data (Wi-Fi passwords, contact cards, personal URLs) to external servers, track user scans, or render custom QR codes that fail to scan when printed.

QRVerity was built to solve these problems:

1. **100% Client-Side Privacy**: Payload and logo processing happen locally in the browser. QRVerity has no application backend, database, tracking scripts, or analytics.
2. **Pre-Download Verification**: QRVerity verifies the rendered QR output in your browser using an independent decoder.
3. **Hard Structural Safety**: Geometric QR structural roles (finder patterns, timing lines, alignment patterns, format/version blocks) are protected by code invariants so logos and decorative styles never silently corrupt essential QR features.

---

## Supported QR Content Types

QRVerity supports nine structured payload formats:

- **URL**: Web links (`http://` and `https://` only; dangerous schemes strictly rejected)
- **Plain Text**: Arbitrary text payloads
- **Wi-Fi**: Wireless network credentials (`WPA`/`WEP`/`nopass`) with proper character escaping
- **Email**: Mailto URIs with recipient, subject, and body (preserves local-part case per RFC 5321)
- **Phone**: Telephone call URIs (`tel:`)
- **SMS**: Short Message Service URIs (`sms:`)
- **vCard**: Contact cards (vCard 3.0 specification with CRLF line endings)
- **Geo**: Geographic location coordinates (`geo:lat,lng`)
- **Calendar**: iCalendar event objects (iCalendar 2.0 with UTC timestamps and CRLF line endings)

---

## Appearance Options

Customize your QR code without sacrificing scannability:

- **Colors**: Custom foreground and background hex colors with WCAG contrast ratio calculations.
- **Data Module Styles**: Square, rounded, or dot data modules applied strictly to data regions.
- **Finder Patterns**: Square or conservative outer-corner rounded finder treatments.
- **Raster Logos**: Local PNG, JPEG, or WebP logo upload (SVG logos strictly forbidden).
- **Safe Logo Clamping**: Logo backing footprint dynamically shrinks or clamps to avoid 100% of protected QR structural modules across versions 1–40.
- **Automatic Error Correction**: Logo upload automatically forces Error Correction Level H before QR matrix encoding.

---

## Predicted Reliability

Predicted Reliability reports whether the rendered QR decoded successfully under QRVerity's test conditions:

- **GOOD**: Rendered QR decoded successfully and matched the encoded content.
- **CAUTION**: Rendered QR decoded successfully, but a quality heuristic (such as moderately low contrast) warrants caution.
- **RISKY**: Verification failed (unable to decode, payload mismatch, or extremely low contrast).

> **Note**: Predicted Reliability tests this rendered QR in your browser. It does not guarantee scanning with every camera, printer, screen, or environment.

---

## Privacy

QRVerity is engineered for user privacy:

- **Local Browser Execution**: Payload and logo processing happen locally in the browser.
- **No QRVerity Backend**: QRVerity operates without an application server, database, or API endpoint.
- **Zero Telemetry / Analytics**: Contains no analytics scripts, tracking pixels, or third-party monitoring libraries.
- **Static Hosting**: The static web host (such as GitHub Pages) serves application HTML/CSS/JS assets to your browser via standard HTTP web server requests. Once loaded, all QR generation and verification run client-side.

---

## Architecture Summary

```
User Input ──► Serializer ──► Canonical Payload ──► Nayuki Adapter ──► QrMatrix & Structure Map
                                                                              │
Preview / Exports / Worker ◄── Canonical SVG ◄── Appearance Renderer ◄────────┘
```

1. **Adapter Isolation**: Nayuki QR-Code-generator is vendored in `src/qr/vendor/` and imported exclusively by `src/qr/encoder.ts`.
2. **Canonical SVG**: A single canonical SVG string drives preview rendering, SVG downloads, pixel-snapped PNG rasterization, clipboard actions, and optical verification.
3. **Web Worker Verification**: Rendered SVG is rasterized into a pixel buffer, transferred to a Web Worker, and decoded via `jsQR` with explicit `inversionAttempts: 'dontInvert'`.

---

## Security

- **Scheme Validation**: URL validation permits `http:` and `https:` schemes only. Dangerous protocols (`javascript:`, `data:`, `file:`, `blob:`, `vbscript:`) are rejected.
- **No Dynamic Evaluation**: Zero usage of `innerHTML`, `dangerouslySetInnerHTML`, `eval`, or `new Function`.
- **Sanitized Logo Decoding**: Logo files are re-rasterized on Canvas to strip EXIF/IPTC/XMP metadata completely.
- **Content Security Policy**: Configured with a restrictive `<meta>` CSP header (`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; object-src 'none'; base-uri 'self'; form-action 'self';`).

---

## Development Setup

### Prerequisites

- Node.js >= 20.x
- npm >= 10.x

### Quick Start

```bash
# Install dependencies
npm ci

# Start local Vite development server
npm run dev

# Run full lint, typecheck, unit, and E2E verification suite
npm run check
```

---

## Testing

QRVerity maintains a comprehensive test suite across unit, integration, accessibility, and cross-browser E2E testing:

```bash
# Run ESLint check
npm run lint

# Run TypeScript compiler type check
npm run typecheck

# Run Vitest unit tests (30 test files, 114 tests)
npm run test:unit

# Run Playwright E2E suite (Chromium, Firefox, WebKit)
npm run test:e2e

# Check Prettier formatting
npm run format:check
```

---

## Deployment

QRVerity builds into static HTML/CSS/JS distribution assets suitable for hosting on GitHub Pages or any static web server:

```bash
# Build production bundle
npm run build

# Preview static build locally
npm run preview
```

GitHub Pages automated deployment is configured in `.github/workflows/deploy.yml` with base path support (`VITE_BASE_PATH`).

---

## Contributing

Contributions are welcome! Please review [CONTRIBUTING.md](CONTRIBUTING.md) for architecture guidelines, code formatting standards, and pull request procedures.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Third-Party Notices

QRVerity incorporates open-source software components under their respective licenses. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for complete attributions:

- **Project Nayuki QR-Code-generator**: MIT License
- **jsQR**: Apache License 2.0
- **Preact & Preact Signals**: MIT License
