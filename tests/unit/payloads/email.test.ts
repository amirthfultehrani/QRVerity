import { describe, expect, it } from 'vitest';
import { emailSerializer } from '../../../src/payloads/email';

describe('Email Payload Serializer', () => {
  it('serializes mailto URI with recipient only', () => {
    const res = emailSerializer.validate({ to: 'user@example.com' });
    expect(res.valid).toBe(true);
    expect(emailSerializer.serialize(res.normalized!)).toBe('mailto:user@example.com');
  });

  it('serializes mailto URI with subject and body correctly encoded', () => {
    const res = emailSerializer.validate({
      to: 'support@qrverity.org',
      subject: 'Help & Feedback',
      body: 'Hello,\nNeed help with QR & scanning!',
    });
    expect(res.valid).toBe(true);
    const serialized = emailSerializer.serialize(res.normalized!);
    expect(serialized).toBe(
      'mailto:support@qrverity.org?subject=Help%20%26%20Feedback&body=Hello%2C%0ANeed%20help%20with%20QR%20%26%20scanning!'
    );
  });

  it('preserves local-part case while lowercasing domain part', () => {
    const res1 = emailSerializer.validate({ to: 'John.Doe@Company.COM' });
    expect(res1.valid).toBe(true);
    expect(res1.normalized?.to).toBe('John.Doe@company.com');
    expect(emailSerializer.serialize(res1.normalized!)).toBe('mailto:John.Doe@company.com');

    const res2 = emailSerializer.validate({ to: 'USER+Tag@EXAMPLE.COM' });
    expect(res2.valid).toBe(true);
    expect(res2.normalized?.to).toBe('USER+Tag@example.com');
    expect(emailSerializer.serialize(res2.normalized!)).toBe('mailto:USER+Tag@example.com');
  });

  it('rejects invalid or empty recipient email addresses', () => {
    const res1 = emailSerializer.validate({ to: '' });
    expect(res1.valid).toBe(false);
    expect(res1.issues[0]?.code).toBe('EMPTY_EMAIL_TO');

    const res2 = emailSerializer.validate({ to: 'not-an-email' });
    expect(res2.valid).toBe(false);
    expect(res2.issues[0]?.code).toBe('INVALID_EMAIL_SYNTAX');
  });
});
