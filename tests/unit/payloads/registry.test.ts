import { describe, expect, it } from 'vitest';
import { getPayloadSerializer, PAYLOAD_REGISTRY } from '../../../src/payloads/registry';
import { PayloadType } from '../../../src/payloads/types';

describe('Payload Serializer Registry', () => {
  it('contains entries for all nine locked v1 payload types', () => {
    const requiredTypes: PayloadType[] = [
      'url',
      'text',
      'wifi',
      'email',
      'phone',
      'sms',
      'vcard',
      'geo',
      'calendar',
    ];

    for (const type of requiredTypes) {
      expect(PAYLOAD_REGISTRY[type]).toBeDefined();
      expect(PAYLOAD_REGISTRY[type].type).toBe(type);
      expect(typeof PAYLOAD_REGISTRY[type].validate).toBe('function');
      expect(typeof PAYLOAD_REGISTRY[type].serialize).toBe('function');
    }
  });

  it('resolves serializers via getPayloadSerializer helper', () => {
    const urlSerializer = getPayloadSerializer('url');
    expect(urlSerializer.type).toBe('url');

    const wifiSerializer = getPayloadSerializer('wifi');
    expect(wifiSerializer.type).toBe('wifi');
  });

  it('throws RangeError when resolving an unregistered payload type', () => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    expect(() => getPayloadSerializer('unknown' as any)).toThrow(RangeError);
  });
});
