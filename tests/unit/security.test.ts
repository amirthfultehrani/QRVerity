import { describe, expect, it } from 'vitest';
import { textSerializer } from '../../src/payloads/text';
import { urlSerializer } from '../../src/payloads/url';
import { vCardSerializer } from '../../src/payloads/vcard';
import { encodeQr } from '../../src/qr/encoder';
import { createStructureMap } from '../../src/qr/structure';
import { normalizeHexColor } from '../../src/render/colors';
import { renderQrSvg } from '../../src/render/svg';

describe('Phase 8 — Security & Input Hardening Suite', () => {
  describe('URL Scheme Security', () => {
    it('strictly permits only http: and https: protocols', () => {
      expect(urlSerializer.validate({ url: 'https://qrverity.org' }).valid).toBe(true);
      expect(urlSerializer.validate({ url: 'http://example.com/path?a=1' }).valid).toBe(true);
    });

    it('rejects dangerous and non-http schemes', () => {
      const dangerousUrls = [
        'javascript:alert(1)',
        ' javascript:alert(1)',
        'JAVASCRIPT:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
        'file:///etc/passwd',
        'blob:https://example.com/uuid',
        'ftp://files.example.com',
      ];

      for (const dangerous of dangerousUrls) {
        const res = urlSerializer.validate({ url: dangerous });
        expect(res.valid).toBe(false);
      }
    });
  });

  describe('Payload String Inertness & HTML Injection Safety', () => {
    it('serializes text payload containing HTML tags as literal text string', () => {
      const input = { text: '<script>alert("xss")</script><img src=x onerror=alert(1)>' };
      const val = textSerializer.validate(input);
      expect(val.valid).toBe(true);
      if (val.valid && val.normalized) {
        const serialized = textSerializer.serialize(val.normalized);
        expect(serialized).toBe(input.text);
      }
    });

    it('serializes vCard payload with dangerous values as inert vCard text', () => {
      const input = {
        firstName: '<img src=x onerror=alert(1)>',
        lastName: 'User',
        email: 'test@example.com',
      };
      const val = vCardSerializer.validate(input);
      expect(val.valid).toBe(true);
      if (val.valid && val.normalized) {
        const serialized = vCardSerializer.serialize(val.normalized);
        expect(serialized).toContain('FN:<img src=x onerror=alert(1)> User');
      }
    });
  });

  describe('Color Input Normalization & Injection Defense', () => {
    it('accepts valid hex colors and normalizes uppercase #RRGGBB', () => {
      expect(normalizeHexColor('#fff')).toBe('#FFFFFF');
      expect(normalizeHexColor('#0969da')).toBe('#0969DA');
    });

    it('rejects invalid or CSS-injected color strings', () => {
      const maliciousColors = [
        'red',
        'rgb(0,0,0)',
        '#12345',
        '#1234567',
        '#000000; background: url(http://evil.com)',
        '"><script>alert(1)</script>',
      ];

      for (const badColor of maliciousColors) {
        expect(() => normalizeHexColor(badColor)).toThrow(RangeError);
      }
    });
  });

  describe('Canonical SVG Output Security', () => {
    it('generates self-contained SVG without script, foreignObject, or remote URLs', () => {
      const { matrix } = encodeQr('https://example.com', { ecc: 'M' });
      const structureMap = createStructureMap(matrix.version);

      const renderRes = renderQrSvg(matrix, structureMap, {
        foreground: '#000000',
        background: '#FFFFFF',
        quietZoneModules: 4,
      });

      const svg = renderRes.svg;

      expect(svg).not.toContain('<script');
      expect(svg).not.toContain('<foreignObject');
      expect(svg).not.toContain('onload=');
      expect(svg).not.toContain('onclick=');

      // Verify no external resource links (excluding standard SVG xmlns attribute)
      const cleanSvg = svg.replace('xmlns="http://www.w3.org/2000/svg"', '');
      expect(cleanSvg).not.toContain('http://');
      expect(cleanSvg).not.toContain('https://');
      expect(cleanSvg).not.toContain('url(');
    });
  });
});
