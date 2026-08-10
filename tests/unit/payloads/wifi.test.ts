import { describe, expect, it } from 'vitest';
import { escapeWifiField, wifiSerializer } from '../../../src/payloads/wifi';

describe('Wi-Fi Payload Serializer', () => {
  it('escapes reserved Wi-Fi characters correctly', () => {
    expect(escapeWifiField('my\\network')).toBe('my\\\\network');
    expect(escapeWifiField('ssid;1')).toBe('ssid\\;1');
    expect(escapeWifiField('pass,word')).toBe('pass\\,word');
    expect(escapeWifiField('net:work')).toBe('net\\:work');
    expect(escapeWifiField('"quotes"')).toBe('\\"quotes\\"');
  });

  it('serializes standard WPA network with escaping', () => {
    const res = wifiSerializer.validate({
      ssid: 'My:Home\\Wifi;',
      security: 'WPA',
      password: 'secret,pass:word;',
      hidden: false,
    });
    expect(res.valid).toBe(true);
    const serialized = wifiSerializer.serialize(res.normalized!);
    expect(serialized).toBe(
      'WIFI:T:WPA;S:My\\:Home\\\\Wifi\\;;P:secret\\,pass\\:word\\;;H:false;;'
    );
  });

  it('serializes unencrypted (nopass) network without password', () => {
    const res = wifiSerializer.validate({
      ssid: 'GuestNetwork',
      security: 'nopass',
      hidden: true,
    });
    expect(res.valid).toBe(true);
    const serialized = wifiSerializer.serialize(res.normalized!);
    expect(serialized).toBe('WIFI:T:nopass;S:GuestNetwork;P:;H:true;;');
  });

  it('rejects missing SSID or password for WPA/WEP', () => {
    const res1 = wifiSerializer.validate({ ssid: '', security: 'WPA', password: 'secret' });
    expect(res1.valid).toBe(false);
    expect(res1.issues.some((i) => i.code === 'EMPTY_SSID')).toBe(true);

    const res2 = wifiSerializer.validate({ ssid: 'Home', security: 'WPA', password: '' });
    expect(res2.valid).toBe(false);
    expect(res2.issues.some((i) => i.code === 'MISSING_PASSWORD')).toBe(true);
  });
});
