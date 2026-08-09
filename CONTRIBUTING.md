# Contributing to PureQR

Thank you for contributing to PureQR. To maintain the highest standard of QR correctness, security, and privacy, all contributions must strictly adhere to the project's frozen architecture decisions.

---

## Architectural Rules & Boundaries

1. **No External Dependencies**: Do not introduce state frameworks (Redux, Zustand, etc.), Tailwind CSS, UI kits, PDF generators, external fonts, or analytics libraries.
2. **Nayuki Vendor Isolation**: Only the single designated adapter in `src/qr/` is permitted to import from `src/qr/vendor/`. Direct vendor imports elsewhere will fail ESLint boundaries and build checks.
3. **Canvas Rules**: Canvas is downstream only for rasterization, PNG export, and verification. It must never become an independent QR generator or source of truth.
4. **Structural Protection**: QR finder patterns, timing patterns, alignment patterns, format/version info, and fixed dark modules are hard invariants. Styling or logo placement must never overwrite protected regions.
5. **No Network Requests**: PureQR runs 100% client-side. No feature may initiate outbound network requests, dynamic shorteners, or remote assets.

---

## Pull Request Guidelines

Before opening a pull request, ensure all verification steps pass locally:

```bash
npm run check
```

Pull requests must pass CI, maintain strict TypeScript mode with zero warnings, and adhere to formatting guidelines (`npm run format`).
