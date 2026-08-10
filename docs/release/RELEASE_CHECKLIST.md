# QRVerity v1.0.0 Release Candidate Checklist

This checklist tracks the release criteria required before tagging and publishing a QRVerity release candidate.

---

## Code Quality & Formatting

- [x] `npm run format:check` passes with zero formatting warnings.
- [x] `npm run lint` passes with 0 ESLint errors and 0 warnings.
- [x] `npm run typecheck` passes with 0 TypeScript compiler errors.

---

## Test Verification

- [x] `npm run test:unit` passes (30 test files, 114 tests).
- [x] Structural invariants validated for all QR versions 1–40.
- [x] Logo geometry collision clamping validated for 0 protected module intersections.
- [x] Canonical SVG renderer and rasterization verified.
- [x] All 9 payload serializers validated against RFC specifications.
- [x] `npm run test:e2e` passes across Chromium, Firefox, and WebKit (37 tests).
- [x] Keyboard focus navigation and accessibility tests pass.

---

## Production Build & Assets

- [x] `npm run build` generates static assets in `dist/` without errors.
- [x] Web Worker asset (`dist/assets/verify.worker-*.js`) bundled and loadable via same-origin URL.
- [x] Subpath deployment build (`VITE_BASE_PATH=/QRVerity/`) verified.
- [x] Zero source maps or debug artifacts in production bundle.

---

## Security & Privacy

- [x] `npm audit` returns 0 vulnerabilities.
- [x] Meta Content-Security-Policy header verified in `index.html`.
- [x] URL scheme validation restricts to `http:` and `https:` schemes.
- [x] SVG logo uploads forbidden; raster logos re-rasterized to strip EXIF metadata.
- [x] Zero network requests made by application after initial asset load.
- [x] Zero `console.log` / `console.error` calls in production source.

---

## Documentation & Metadata

- [x] `package.json` version updated to `1.0.0`.
- [x] `README.md` updated with architecture, features, privacy, and development setup.
- [x] `CHANGELOG.md` updated for v1.0.0 release notes.
- [x] `LICENSE` file committed (MIT License).
- [x] `THIRD_PARTY_NOTICES.md` accurately attributes Nayuki, jsQR, and Preact.
- [x] `SECURITY.md` and `PRIVACY.md` reflect actual application architecture.
- [x] GitHub issue templates and PR template committed.

---

## Deployment & Final Tags

- [x] GitHub Pages workflow (`.github/workflows/deploy.yml`) active on `main` branch.
- [x] Release notes prepared in `docs/release/1.0.0.md`.
- [ ] Git tag `v1.0.0` created (manual step by maintainer).
- [ ] GitHub Release published (manual step by maintainer).
