# 0004. QR Core Specification & Structural Protection Engine

This document specifies PureQR's QR generation pipeline, Nayuki vendor isolation, matrix geometry model, and structural region protection engine.

---

## 1. Nayuki Vendoring & Adapter Boundary

- **Upstream Repository**: `https://github.com/nayuki/QR-Code-generator`
- **Vendored Location**: `src/qr/vendor/nayuki/qrcodegen.ts`
- **Pinned Upstream Commit**: `9f9331899166099df2809f6df8d0a8523efec97c`
- **License**: MIT License (Copyright (c) Project Nayuki)

### Why Vendored

Nayuki's QR-Code-generator is the single gold-standard, zero-dependency, algorithmically pure QR encoding library in TypeScript. Vendoring it directly inside `src/qr/vendor/nayuki/` ensures immutable supply-chain safety, offline reproducibility, and zero risk of unexpected upstream package mutations.

### Vendored Source Status

The vendored file `qrcodegen.ts` is **adapted but behavior-equivalent** to the pinned upstream commit. Minor modifications were applied solely for TypeScript strict mode compatibility (`noUnusedLocals`, `strictNullChecks`), ESLint suppression, and JavaScript bitwise operator grouping in `reedSolomonMultiply`. All QR encoding logic, Reed-Solomon math, and matrix output remain 100% identical to upstream Nayuki algorithms.

### Update Procedure

1. Copy the updated `qrcodegen.ts` from Project Nayuki's repository into `src/qr/vendor/nayuki/qrcodegen.ts`.
2. Update the recorded commit hash in the header of `qrcodegen.ts` and in this document.
3. Run the full verification suite (`npm run check`) to ensure all golden matrix vectors and adapter tests pass cleanly.

### Single Adapter Rule

`src/qr/encoder.ts` is the **ONLY** production module in the repository permitted to import `src/qr/vendor/nayuki/qrcodegen`. UI components, renderers, payloads, workers, and export modules must never import Nayuki internals directly. This rule is enforced programmatically by ESLint import boundary rules and `tests/unit/qr/boundary.test.ts`.

---

## 2. QrMatrix Coordinate System & Geometry

- **Origin**: Top-left corner `(0, 0)`.
- **Horizontal Axis (`x`)**: Increases rightward from `0` to `size - 1`.
- **Vertical Axis (`y`)**: Increases downward from `0` to `size - 1`.
- **Matrix Size Formula**: `size = 17 + 4 * version` (where version is between 1 and 40).
- **Quiet Zone Boundary**: The Quiet Zone (minimum 4 modules) exists **outside** the `QrMatrix`. `QrMatrix` represents only the symbol's internal `size x size` grid.

---

## 3. Structural Region Map & Protection Invariants

PureQR independently owns its structural region classification derived strictly from QR VERSION and geometry (ISO/IEC 18004 specification). Structural classification is independent of module dark/light state.

### Defined Structural Roles (`QrModuleRole`)

| Role          | Description                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------------- |
| `finder`      | 7x7 finder pattern boxes at top-left, top-right, and bottom-left                                                      |
| `separator`   | 1-module light border surrounding each of the 3 finders                                                               |
| `timing`      | Alternating timing pattern lines at row 6 and column 6                                                                |
| `alignment`   | 5x5 alignment patterns (Versions 2–40, centered according to ISO/IEC 18004 alignment tables; finder overlap excluded) |
| `format`      | 15 format information bits around top-left, top-right, and bottom-left finders                                        |
| `version`     | 18 version information bits (Versions 7–40, 3x6 at bottom-left and 6x3 at top-right)                                  |
| `dark-module` | Single fixed dark module at `(8, 4 * version + 9)`                                                                    |
| `data`        | All remaining payload and ECC modules                                                                                 |

### Safety Invariant Warning

> [!CAUTION]
> **HARD INVARIANT**: Future rendering and styling code MUST treat `isProtected(x, y)` as a hard safety boundary. Styling controls, module rounding, or custom logos must NEVER overwrite or corrupt any coordinate where `isProtected(x, y) === true`.
