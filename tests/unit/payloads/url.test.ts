import { describe, expect, it } from 'vitest';
import { urlSerializer } from '../../../src/payloads/url';

describe('URL Payload Serializer', () => {
  it('validates and serializes valid HTTPS and HTTP URLs', () => {
    const res1 = urlSerializer.validate({ url: 'https://example.com/path?foo=bar#hash' });
    expect(res1.valid).toBe(true);
    expect(res1.normalized?.url).toBe('https://example.com/path?foo=bar#hash');
    expect(urlSerializer.serialize(res1.normalized!)).toBe('https://example.com/path?foo=bar#hash');

    const res2 = urlSerializer.validate({ url: 'http://pureqr.org' });
    expect(res2.valid).toBe(true);
    expect(urlSerializer.serialize(res2.normalized!)).toBe('http://pureqr.org/');
  });

  it('trims surrounding whitespace', () => {
    const res = urlSerializer.validate({ url: '  https://github.com  ' });
    expect(res.valid).toBe(true);
    expect(urlSerializer.serialize(res.normalized!)).toBe('https://github.com/');
  });

  it('rejects empty URL', () => {
    const res = urlSerializer.validate({ url: '   ' });
    expect(res.valid).toBe(false);
    expect(res.issues[0]?.code).toBe('EMPTY_URL');
  });

  it('rejects forbidden or unsafe schemes', () => {
    const forbidden = [
      'javascript:alert(1)',
      'data:text/html,<h1>hack</h1>',
      'file:///etc/passwd',
      'blob:http://example.com/123',
      'ftp://example.com/file',
      'vbscript:msgbox(1)',
    ];

    for (const url of forbidden) {
      const res = urlSerializer.validate({ url });
      expect(res.valid).toBe(false);
      expect(res.issues[0]?.code).toBe('UNSUPPORTED_SCHEME');
    }
  });

  it('rejects malformed URLs', () => {
    const res = urlSerializer.validate({ url: 'not-a-url' });
    expect(res.valid).toBe(false);
    expect(res.issues[0]?.code).toBe('INVALID_URL_SYNTAX');
  });
});
