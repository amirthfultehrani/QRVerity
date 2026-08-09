import { describe, expect, it } from 'vitest';
import { exportQrSvg } from '../../../src/export/svg';
import { isCopyImageSupported, isCopyTextSupported } from '../../../src/export/clipboard';
import { encodeQr } from '../../../src/qr/encoder';
import { createStructureMap } from '../../../src/qr/structure';
import { renderQrSvg } from '../../../src/render/svg';

describe('Export Module Unit Tests', () => {
  it('creates valid SVG export result using canonical SVG string', () => {
    const { matrix } = encodeQr('https://qrverity.org', { ecc: 'M' });
    const structure = createStructureMap(matrix.version);
    const renderResult = renderQrSvg(matrix, structure, {
      foreground: '#000000',
      background: '#FFFFFF',
      quietZoneModules: 4,
    });

    const exportResult = exportQrSvg(renderResult.svg, 'url');

    expect(exportResult.filename).toBe('qrverity-url.svg');
    expect(exportResult.blob).toBeInstanceOf(Blob);
    expect(exportResult.blob.type).toBe('image/svg+xml;charset=utf-8');
  });

  it('detects clipboard capability functions without crashing', () => {
    expect(typeof isCopyTextSupported()).toBe('boolean');
    expect(typeof isCopyImageSupported()).toBe('boolean');
  });
});
