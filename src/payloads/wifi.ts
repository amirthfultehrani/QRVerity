import { PayloadIssue, PayloadSerializer, PayloadValidationResult } from './types';

export type WifiSecurity = 'WPA' | 'WEP' | 'nopass';

export interface WifiPayloadInput {
  ssid: string;
  security: WifiSecurity;
  password?: string | undefined;
  hidden?: boolean | undefined;
}

export interface WifiPayloadNormalized {
  ssid: string;
  security: WifiSecurity;
  password?: string | undefined;
  hidden: boolean;
}

export const MAX_SSID_LENGTH = 32;
export const MAX_WIFI_PASSWORD_LENGTH = 63;

/**
 * Escapes reserved Wi-Fi QR characters: \, ;, ,, :, "
 */
export function escapeWifiField(field: string): string {
  if (typeof field !== 'string') return '';
  return field.replace(/([\\;,:"])/g, '\\$1');
}

/**
 * Wi-Fi Payload Serializer & Validator
 */
export class WifiPayloadSerializer implements PayloadSerializer<
  WifiPayloadInput,
  WifiPayloadNormalized
> {
  public readonly type = 'wifi';

  public validate(input: WifiPayloadInput): PayloadValidationResult<WifiPayloadNormalized> {
    const issues: PayloadIssue[] = [];

    if (!input) {
      return {
        valid: false,
        issues: [
          {
            code: 'INVALID_INPUT',
            message: 'Wi-Fi input is required',
            severity: 'error',
          },
        ],
      };
    }

    // 1. Validate SSID
    if (typeof input.ssid !== 'string' || input.ssid.length === 0) {
      issues.push({
        code: 'EMPTY_SSID',
        message: 'Network SSID is required',
        field: 'ssid',
        severity: 'error',
      });
    } else if (input.ssid.length > MAX_SSID_LENGTH) {
      issues.push({
        code: 'SSID_TOO_LONG',
        message: `SSID exceeds maximum length of ${MAX_SSID_LENGTH} characters`,
        field: 'ssid',
        severity: 'error',
      });
    }

    // 2. Validate Security
    const allowedSecurity: WifiSecurity[] = ['WPA', 'WEP', 'nopass'];
    if (!allowedSecurity.includes(input.security)) {
      issues.push({
        code: 'INVALID_SECURITY',
        message: `Security mode "${String(input.security)}" is invalid. Must be 'WPA', 'WEP', or 'nopass'.`,
        field: 'security',
        severity: 'error',
      });
    }

    // 3. Validate Password based on security mode
    const password = input.password ?? '';
    if (input.security === 'WPA' || input.security === 'WEP') {
      if (password.length === 0) {
        issues.push({
          code: 'MISSING_PASSWORD',
          message: `Password is required when security mode is ${input.security}`,
          field: 'password',
          severity: 'error',
        });
      } else if (password.length > MAX_WIFI_PASSWORD_LENGTH) {
        issues.push({
          code: 'PASSWORD_TOO_LONG',
          message: `Password exceeds maximum length of ${MAX_WIFI_PASSWORD_LENGTH} characters`,
          field: 'password',
          severity: 'error',
        });
      }
    }

    if (issues.length > 0) {
      return { valid: false, issues };
    }

    const normalized: WifiPayloadNormalized = {
      ssid: input.ssid,
      security: input.security,
      password: input.security === 'nopass' ? undefined : password,
      hidden: Boolean(input.hidden),
    };

    return {
      valid: true,
      normalized,
      issues: [],
    };
  }

  public serialize(normalized: WifiPayloadNormalized): string {
    if (!normalized || !normalized.ssid || !normalized.security) {
      throw new Error('Invalid normalized input for Wi-Fi serialization');
    }

    const security = normalized.security;
    const escapedSsid = escapeWifiField(normalized.ssid);
    const escapedPassword =
      security === 'nopass' || !normalized.password ? '' : escapeWifiField(normalized.password);
    const hidden = normalized.hidden ? 'true' : 'false';

    return `WIFI:T:${security};S:${escapedSsid};P:${escapedPassword};H:${hidden};;`;
  }
}

export const wifiSerializer = new WifiPayloadSerializer();
