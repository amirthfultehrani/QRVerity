import { describe, expect, it } from 'vitest';
import { smsSerializer } from '../../../src/payloads/sms';

describe('SMS Payload Serializer (RFC 5724)', () => {
  it('serializes SMS URI with recipient number only', () => {
    const res = smsSerializer.validate({ number: '+15551234567' });
    expect(res.valid).toBe(true);
    expect(smsSerializer.serialize(res.normalized!)).toBe('sms:+15551234567');
  });

  it('serializes SMS URI with message body correctly encoded', () => {
    const res = smsSerializer.validate({
      number: '+15551234567',
      message: 'Meet at 5pm? & Bring 🍕!',
    });
    expect(res.valid).toBe(true);
    const serialized = smsSerializer.serialize(res.normalized!);
    expect(serialized).toBe(
      'sms:+15551234567?body=Meet%20at%205pm%3F%20%26%20Bring%20%F0%9F%8D%95!'
    );
  });

  it('rejects invalid recipient number', () => {
    const res = smsSerializer.validate({ number: 'invalid-number', message: 'Hello' });
    expect(res.valid).toBe(false);
    expect(res.issues[0]?.code).toBe('INVALID_PHONE_FORMAT');
  });
});
