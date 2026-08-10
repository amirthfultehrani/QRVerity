import { describe, expect, it } from 'vitest';
import { geoSerializer } from '../../../src/payloads/geo';

describe('Geo Coordinates Payload Serializer', () => {
  it('serializes valid numeric latitude and longitude', () => {
    const res1 = geoSerializer.validate({ latitude: 38.8977, longitude: -77.0365 });
    expect(res1.valid).toBe(true);
    expect(geoSerializer.serialize(res1.normalized!)).toBe('geo:38.8977,-77.0365');

    const res2 = geoSerializer.validate({ latitude: '0', longitude: '0' });
    expect(res2.valid).toBe(true);
    expect(geoSerializer.serialize(res2.normalized!)).toBe('geo:0,0');
  });

  it('validates coordinate range boundaries', () => {
    const boundaryValid = geoSerializer.validate({ latitude: -90, longitude: 180 });
    expect(boundaryValid.valid).toBe(true);
    expect(geoSerializer.serialize(boundaryValid.normalized!)).toBe('geo:-90,180');
  });

  it('rejects out of range latitude or longitude', () => {
    const res1 = geoSerializer.validate({ latitude: 90.1, longitude: 0 });
    expect(res1.valid).toBe(false);
    expect(res1.issues[0]?.code).toBe('LATITUDE_OUT_OF_RANGE');

    const res2 = geoSerializer.validate({ latitude: 0, longitude: -180.5 });
    expect(res2.valid).toBe(false);
    expect(res2.issues[0]?.code).toBe('LONGITUDE_OUT_OF_RANGE');
  });

  it('rejects NaN, Infinity, and non-numeric inputs', () => {
    expect(geoSerializer.validate({ latitude: NaN, longitude: 0 }).valid).toBe(false);
    expect(geoSerializer.validate({ latitude: 0, longitude: Infinity }).valid).toBe(false);
    expect(geoSerializer.validate({ latitude: 'abc', longitude: '123' }).valid).toBe(false);
  });
});
