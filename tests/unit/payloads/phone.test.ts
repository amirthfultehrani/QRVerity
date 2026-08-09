import { describe, expect, it } from 'vitest';
import { phoneSerializer } from '../../../src/payloads/phone';

describe('Phone Payload Serializer', () => {
  it('serializes valid international phone numbers', () => {
    const res1 = phoneSerializer.validate({ number: '+1 (555) 123-4567' });
    expect(res1.valid).toBe(true);
    expect(phoneSerializer.serialize(res1.normalized!)).toBe('tel:+1 (555) 123-4567');

    const res2 = phoneSerializer.validate({ number: '+44 20 7946 0958' });
    expect(res2.valid).toBe(true);
    expect(phoneSerializer.serialize(res2.normalized!)).toBe('tel:+44 20 7946 0958');
  });

  it('rejects empty phone numbers', () => {
    const res = phoneSerializer.validate({ number: '   ' });
    expect(res.valid).toBe(false);
    expect(res.issues[0]?.code).toBe('EMPTY_PHONE');
  });

  it('rejects phone numbers containing invalid letters or symbols', () => {
    const res = phoneSerializer.validate({ number: '+1-555-CALL-ME' });
    expect(res.valid).toBe(false);
    expect(res.issues[0]?.code).toBe('INVALID_PHONE_FORMAT');
  });
});
