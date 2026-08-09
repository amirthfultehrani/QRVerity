import { describe, expect, it } from 'vitest';
import { encodeQr } from '../../../src/qr/encoder';
import { getPayloadSerializer, PAYLOAD_REGISTRY } from '../../../src/payloads/registry';
import { PayloadType } from '../../../src/payloads/types';

describe('Phase 3 Payload -> QR Encoder Integration Suite', () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const validInputs: Record<PayloadType, any> = {
    url: { url: 'https://pureqr.org' },
    text: { text: 'Hello PureQR Core!' },
    wifi: { ssid: 'MyHomeWifi', security: 'WPA', password: 'secretpassword123' },
    email: { to: 'user@example.com', subject: 'Inquiry', body: 'Hello PureQR' },
    phone: { number: '+15550199' },
    sms: { number: '+15550199', message: 'Hello via SMS' },
    vcard: { firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com' },
    geo: { latitude: 37.7749, longitude: -122.4194 },
    calendar: {
      title: 'Sync Meeting',
      start: new Date(Date.UTC(2026, 7, 8, 10, 0, 0)),
      end: new Date(Date.UTC(2026, 7, 8, 11, 0, 0)),
    },
  };

  it('validates, serializes, and encodes every v1 payload type cleanly with encodeQr()', () => {
    const payloadTypes = Object.keys(PAYLOAD_REGISTRY) as PayloadType[];

    for (const type of payloadTypes) {
      const serializer = getPayloadSerializer(type);
      const rawInput = validInputs[type];

      // 1. Validate structured input
      const validationResult = serializer.validate(rawInput);
      expect(validationResult.valid, `Payload type "${type}" validation failed`).toBe(true);
      expect(validationResult.normalized).toBeDefined();

      // 2. Serialize to canonical string
      const canonicalString = serializer.serialize(validationResult.normalized);
      expect(typeof canonicalString).toBe('string');
      expect(canonicalString.length).toBeGreaterThan(0);

      // 3. Pass canonical string directly into PureQR encodeQr()
      const { matrix, metadata } = encodeQr(canonicalString, { ecc: 'M' });

      expect(matrix).toBeDefined();
      expect(matrix.size).toBeGreaterThanOrEqual(21);
      expect(metadata.version).toBeGreaterThanOrEqual(1);
    }
  });
});
