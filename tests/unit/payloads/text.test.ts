import { describe, expect, it } from 'vitest';
import { textSerializer } from '../../../src/payloads/text';

describe('Plain Text Payload Serializer', () => {
  it('preserves raw text content including ASCII, Unicode, and Emoji', () => {
    const text = 'Hello PureQR! 🔒 こんにちは 🚀';
    const res = textSerializer.validate({ text });
    expect(res.valid).toBe(true);
    expect(textSerializer.serialize(res.normalized!)).toBe(text);
  });

  it('preserves multiline text, quotes, semicolons, and special characters', () => {
    const text = 'Line 1\nLine 2; "quotes" & <tags>';
    const res = textSerializer.validate({ text });
    expect(res.valid).toBe(true);
    expect(textSerializer.serialize(res.normalized!)).toBe(text);
  });

  it('rejects empty or whitespace-only text', () => {
    const res1 = textSerializer.validate({ text: '' });
    expect(res1.valid).toBe(false);
    expect(res1.issues[0]?.code).toBe('EMPTY_TEXT');

    const res2 = textSerializer.validate({ text: '   \n  ' });
    expect(res2.valid).toBe(false);
    expect(res2.issues[0]?.code).toBe('EMPTY_TEXT');
  });

  it('rejects text exceeding maximum length bound', () => {
    const longText = 'a'.repeat(5000);
    const res = textSerializer.validate({ text: longText });
    expect(res.valid).toBe(false);
    expect(res.issues[0]?.code).toBe('TEXT_TOO_LONG');
  });
});
