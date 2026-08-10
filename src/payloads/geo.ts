import { PayloadIssue, PayloadSerializer, PayloadValidationResult } from './types';

export interface GeoPayloadInput {
  latitude: number | string;
  longitude: number | string;
}

export interface GeoPayloadNormalized {
  latitude: number;
  longitude: number;
}

/**
 * Geo Coordinates Payload Serializer & Validator
 */
export class GeoPayloadSerializer implements PayloadSerializer<
  GeoPayloadInput,
  GeoPayloadNormalized
> {
  public readonly type = 'geo';

  public validate(input: GeoPayloadInput): PayloadValidationResult<GeoPayloadNormalized> {
    const issues: PayloadIssue[] = [];

    if (!input) {
      return {
        valid: false,
        issues: [
          {
            code: 'INVALID_INPUT',
            message: 'Geographic input is required',
            severity: 'error',
          },
        ],
      };
    }

    const parseNum = (val: number | string): number => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string' && val.trim() !== '') return Number(val.trim());
      return NaN;
    };

    const lat = parseNum(input.latitude);
    const lng = parseNum(input.longitude);

    if (isNaN(lat) || !Number.isFinite(lat)) {
      issues.push({
        code: 'INVALID_LATITUDE',
        message: 'Latitude must be a valid number',
        field: 'latitude',
        severity: 'error',
      });
    } else if (lat < -90 || lat > 90) {
      issues.push({
        code: 'LATITUDE_OUT_OF_RANGE',
        message: `Latitude ${lat} is out of valid range [-90, 90]`,
        field: 'latitude',
        severity: 'error',
      });
    }

    if (isNaN(lng) || !Number.isFinite(lng)) {
      issues.push({
        code: 'INVALID_LONGITUDE',
        message: 'Longitude must be a valid number',
        field: 'longitude',
        severity: 'error',
      });
    } else if (lng < -180 || lng > 180) {
      issues.push({
        code: 'LONGITUDE_OUT_OF_RANGE',
        message: `Longitude ${lng} is out of valid range [-180, 180]`,
        field: 'longitude',
        severity: 'error',
      });
    }

    if (issues.length > 0) {
      return { valid: false, issues };
    }

    return {
      valid: true,
      normalized: { latitude: lat, longitude: lng },
      issues: [],
    };
  }

  public serialize(normalized: GeoPayloadNormalized): string {
    if (
      !normalized ||
      typeof normalized.latitude !== 'number' ||
      typeof normalized.longitude !== 'number'
    ) {
      throw new Error('Invalid normalized input for Geo serialization');
    }

    return `geo:${normalized.latitude},${normalized.longitude}`;
  }
}

export const geoSerializer = new GeoPayloadSerializer();
