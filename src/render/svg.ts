import { QrMatrix, QrStructureMap } from '../qr/types';
import { normalizeHexColor } from './colors';
import { calculateSafeLogoBounds } from './logo/geometry';
import { DataModuleStyle, FinderStyle, QrRenderOptions, QrRenderResult } from './types';

/**
 * Pure Canonical SVG QR Renderer with Structurally Safe Appearance & Logo Support
 *
 * Requirements:
 * - Single Canonical Visual Renderer: Preview, SVG/PNG export, and optical verification ALL consume this output.
 * - Structural Safety Boundary: Protected modules (finder, separator, timing, alignment, format, version, dark-module)
 *   MUST NEVER be rounded into dots or occluded by a logo. Decorative module styling applies ONLY to 'data' modules.
 * - Safe Logo Embedding: Logos are embedded locally via clean data URLs. Logo backing footprint avoids 100% of protected modules.
 */
export function renderQrSvg(
  matrix: QrMatrix,
  structureMap: QrStructureMap,
  options: QrRenderOptions
): QrRenderResult {
  if (!matrix || typeof matrix.size !== 'number' || matrix.size < 21) {
    throw new RangeError('Invalid QrMatrix: Size must be a valid integer >= 21');
  }

  if (!structureMap || structureMap.size !== matrix.size) {
    throw new RangeError('Invalid QrStructureMap: Size must match QrMatrix size');
  }

  const fg = normalizeHexColor(options.foreground);
  const bg = normalizeHexColor(options.background);

  const quietZone = options.quietZoneModules;
  if (typeof quietZone !== 'number' || !Number.isInteger(quietZone) || quietZone < 4) {
    throw new RangeError(`Invalid quietZoneModules: ${quietZone}. Must be an integer >= 4.`);
  }

  const dataStyle: DataModuleStyle = options.dataModuleStyle ?? 'square';
  const finderStyle: FinderStyle = options.finderStyle ?? 'square';

  const size = matrix.size;
  const totalModules = size + quietZone * 2;

  // Calculate safe logo bounds if logo is provided
  const logoPadding = options.logoPaddingModules ?? 0.5;
  const safeLogoBounds = options.logo
    ? calculateSafeLogoBounds(size, structureMap, options.logoScale ?? 0.15, logoPadding)
    : null;

  const svgParts: string[] = [];

  // SVG header
  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${totalModules}" shape-rendering="crispEdges">`
  );

  // Background rect
  svgParts.push(`<rect width="${totalModules}" height="${totalModules}" fill="${bg}"/>`);

  // Group modules with default foreground fill
  svgParts.push(`<g fill="${fg}">`);

  // Helper to test if module coordinate (x, y) is occluded by logo or logo padding
  const isOccludedByLogo = (x: number, y: number): boolean => {
    if (!safeLogoBounds) return false;
    const footMinX = Math.floor(safeLogoBounds.minX - logoPadding);
    const footMaxX = Math.ceil(safeLogoBounds.maxX + logoPadding) - 1;
    const footMinY = Math.floor(safeLogoBounds.minY - logoPadding);
    const footMaxY = Math.ceil(safeLogoBounds.maxY + logoPadding) - 1;
    return x >= footMinX && x <= footMaxX && y >= footMinY && y <= footMaxY;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Skip rendering QR modules under logo footprint
      if (isOccludedByLogo(x, y)) {
        continue;
      }

      if (matrix.isDark(x, y)) {
        const vx = x + quietZone;
        const vy = y + quietZone;
        const role = structureMap.roleAt(x, y);

        if (role === 'finder') {
          // Finders are drawn explicitly outside the module loop to allow holistic styling
          continue;
        }

        if (role === 'data') {
          // Apply decorative styling ONLY to data modules
          if (dataStyle === 'rounded') {
            svgParts.push(`<rect x="${vx}" y="${vy}" width="1" height="1" rx="0.2" ry="0.2"/>`);
          } else if (dataStyle === 'dot') {
            svgParts.push(`<circle cx="${vx + 0.5}" cy="${vy + 0.5}" r="0.42"/>`);
          } else {
            svgParts.push(`<rect x="${vx}" y="${vy}" width="1" height="1"/>`);
          }
        } else {
          // Protected non-data modules (separator, timing, alignment, format, version, dark-module)
          // render strictly as conservative 1x1 squares
          svgParts.push(`<rect x="${vx}" y="${vy}" width="1" height="1"/>`);
        }
      }
    }
  }

  // Draw the 3 finder patterns explicitly
  const finderPositions = [
    { x: 0, y: 0 },
    { x: size - 7, y: 0 },
    { x: 0, y: size - 7 },
  ];

  for (const pos of finderPositions) {
    const vx = pos.x + quietZone;
    const vy = pos.y + quietZone;

    if (finderStyle === 'rounded') {
      // Outer 7x7 ring
      svgParts.push(
        `<rect x="${vx + 0.5}" y="${vy + 0.5}" width="6" height="6" fill="none" stroke="${fg}" stroke-width="1" rx="1.5" ry="1.5"/>`
      );
      // Inner 3x3 square
      svgParts.push(
        `<rect x="${vx + 2}" y="${vy + 2}" width="3" height="3" fill="${fg}" rx="0.5" ry="0.5"/>`
      );
    } else {
      // Outer 7x7 ring
      svgParts.push(
        `<rect x="${vx + 0.5}" y="${vy + 0.5}" width="6" height="6" fill="none" stroke="${fg}" stroke-width="1"/>`
      );
      // Inner 3x3 square
      svgParts.push(`<rect x="${vx + 2}" y="${vy + 2}" width="3" height="3" fill="${fg}"/>`);
    }
  }

  svgParts.push('</g>');

  // Draw logo backing box and embedded image if valid logo bounds exist
  if (options.logo && safeLogoBounds) {
    const lx = safeLogoBounds.minX + quietZone;
    const ly = safeLogoBounds.minY + quietZone;
    const lw = safeLogoBounds.widthModules;
    const lh = safeLogoBounds.heightModules;

    // Draw background padding box
    svgParts.push(
      `<rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" fill="${bg}" rx="0.5" ry="0.5"/>`
    );

    // Draw embedded raster logo image
    svgParts.push(
      `<image x="${lx}" y="${ly}" width="${lw}" height="${lh}" href="${options.logo.dataUrl}" preserveAspectRatio="xMidYMid meet"/>`
    );
  }

  svgParts.push('</svg>');

  return {
    svg: svgParts.join(''),
    matrixSize: size,
    quietZoneModules: quietZone,
    totalModules,
    foreground: fg,
    background: bg,
    dataModuleStyle: dataStyle,
    finderStyle,
    hasLogo: Boolean(options.logo && safeLogoBounds),
    effectiveLogoScale: safeLogoBounds ? safeLogoBounds.effectiveScale : 0,
  };
}
