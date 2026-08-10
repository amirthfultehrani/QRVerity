import { describe, expect, it } from 'vitest';
import { escapeVCardValue, vCardSerializer } from '../../../src/payloads/vcard';

describe('vCard 3.0 Payload Serializer', () => {
  it('escapes reserved vCard 3.0 characters', () => {
    expect(escapeVCardValue('Smith\\Jones')).toBe('Smith\\\\Jones');
    expect(escapeVCardValue('First;Middle')).toBe('First\\;Middle');
    expect(escapeVCardValue('City, State')).toBe('City\\, State');
    expect(escapeVCardValue('Line 1\nLine 2')).toBe('Line 1\\nLine 2');
  });

  it('serializes complete vCard 3.0 contact with CRLF line endings', () => {
    const res = vCardSerializer.validate({
      firstName: 'Jane',
      lastName: 'Doe',
      organization: 'Acme, Inc.',
      title: 'Senior Developer',
      phone: '+1-555-0199',
      email: 'jane.doe@example.com',
      website: 'https://example.com',
      street: '123 Main St; Suite 100',
      city: 'Metropolis',
      region: 'NY',
      postalCode: '10001',
      country: 'USA',
      note: 'Key contact;\nAvailable 9-5',
    });

    expect(res.valid).toBe(true);
    const serialized = vCardSerializer.serialize(res.normalized!);

    const expected = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Doe;Jane;;;',
      'FN:Jane Doe',
      'ORG:Acme\\, Inc.',
      'TITLE:Senior Developer',
      'TEL:+1-555-0199',
      'EMAIL:jane.doe@example.com',
      'URL:https://example.com',
      'ADR:;;123 Main St\\; Suite 100;Metropolis;NY;10001;USA',
      'NOTE:Key contact\\;\\nAvailable 9-5',
      'END:VCARD',
    ].join('\r\n');

    expect(serialized).toBe(expected);
  });

  it('serializes minimal vCard with organization only', () => {
    const res = vCardSerializer.validate({ organization: 'QRVerity Project' });
    expect(res.valid).toBe(true);
    const serialized = vCardSerializer.serialize(res.normalized!);

    const expected = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:;;;;',
      'FN:QRVerity Project',
      'ORG:QRVerity Project',
      'END:VCARD',
    ].join('\r\n');

    expect(serialized).toBe(expected);
  });

  it('rejects input without any contact identifiers', () => {
    const res = vCardSerializer.validate({
      city: 'Metropolis',
      note: 'Just a note',
    });
    expect(res.valid).toBe(false);
    expect(res.issues[0]?.code).toBe('MISSING_CONTACT_IDENTIFIER');
  });
});
