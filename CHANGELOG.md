# Changelog

All notable changes to PureQR will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-08

### Added

- **Privacy-First Client-Side Architecture**: 100% client-side QR generator with zero application backend, database, analytics, or external tracking.
- **Nine Payload Serializers**: Full validation, normalization, and serialization for URL, Plain Text, Wi-Fi, Email, Phone, SMS, vCard 3.0, Geo, and iCalendar 2.0.
- **Pre-Download Optical Verification**: Worker-isolated `jsQR` optical verification rasterizing rendered SVG output and returning deterministic **Predicted Reliability** statuses (`GOOD`, `CAUTION`, `RISKY`).
- **Structurally Safe Customization**: Data module shape styling (square, rounded, dot), outer finder corner treatments, custom hex color combinations with WCAG contrast calculations, and metadata-stripped PNG/JPEG/WebP raster logo embedding.
- **Hard Code Invariants**: Protected QR structural roles (finder patterns, separators, timing lines, alignment patterns, format/version blocks, dark module) are strictly protected against decorative module rounding and logo occlusions.
- **Multi-Format Export**: Vector SVG file download, pixel-snapped PNG file download (256px–2048px presets), Copy SVG to clipboard, and Copy Image to clipboard (where supported by browser `ClipboardItem` API).
- **Accessibility & Cross-Browser Hardening**: Designed toward WCAG 2.2 AA standards with full keyboard focus rings, screen reader live regions, and Playwright test coverage across Chromium, Firefox, and WebKit (Safari).
- **GitHub Pages Deployment**: Automated static site deployment with base-path configuration (`VITE_BASE_PATH`) and meta Content-Security-Policy enforcement.

## [0.1.0] - 2026-08-08

### Added

- Initial repository foundation (Phase 0).
- Configured Vite + Preact + TypeScript strict compilation.
- Configured ESLint with architectural import restriction rules and Prettier formatting.
- Configured Vitest unit test runner and Playwright E2E testing.
- Added `@axe-core/playwright` accessibility smoke testing.
- Initialized core application shell and system-font responsive CSS foundation.
- Added GitHub Actions workflows for CI, E2E, CodeQL, Dependabot, and GitHub Pages deployment.
- Authored architecture freeze, data flow pipeline, and module boundary specifications.
