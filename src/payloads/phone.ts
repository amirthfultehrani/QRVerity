import { PayloadIssue, PayloadSerializer, PayloadValidationResult } from './types';

export interface PhonePayloadInput {
  number: string;
}

export interface PhonePayloadNormalized {
  number: string;
}

export const MAX_PHONE_LENGTH = 32;

// Allowed telephone dial characters: +, digits, spaces, -, ., (, ), *, #
const PHONE_DIAL_REGEX = /^\+?[0-9\s\-.( )*#]{1,32}$/;

/**
 * Phone Payload Serializer & Validator
 */
export class PhonePayloadSerializer implements PayloadSerializer<
  PhonePayloadInput,
  PhonePayloadNormalized
> {
  public readonly type = 'phone';

  public validate(input: PhonePayloadInput): PayloadValidationResult<PhonePayloadNormalized> {
    if (!input || typeof input.number !== 'string') {
      return {
        valid: false,
        issues: [
          {
            code: 'INVALID_INPUT',
            message: 'Phone number must be a string',
            field: 'number',
            severity: 'error',
          },
        ],
      };
    }

    const trimmed = input.number.trim();

    if (trimmed.length === 0) {
      return {
        valid: false,
        issues: [
          {
            code: 'EMPTY_PHONE',
            message: 'Phone number cannot be empty',
            field: 'number',
            severity: 'error',
          },
        ],
      };
    }

    if (trimmed.length > MAX_PHONE_LENGTH) {
      return {
        valid: false,
        issues: [
          {
            code: 'PHONE_TOO_LONG',
            message: `Phone number exceeds maximum length of ${MAX_PHONE_LENGTH} characters`,
            field: 'number',
            severity: 'error',
          },
        ],
      };
    }

    if (!PHONE_DIAL_REGEX.test(trimmed) || !/\d/.test(trimmed)) {
      const issues: PayloadIssue[] = [
        {
          code: 'INVALID_PHONE_FORMAT',
          message:
            'Phone number contains invalid characters. Only digits, +, -, ., parentheses, and spaces are allowed.',
          field: 'number',
          severity: 'error',
        },
      ];
      return { valid: false, issues };
    }

    return {
      valid: true,
      normalized: { number: trimmed },
      issues: [],
    };
  }

  public serialize(normalized: PhonePayloadNormalized): string {
    if (!normalized || typeof normalized.number !== 'string') {
      throw new Error('Invalid normalized input for Phone serialization');
    }

    return `tel:${normalized.number}`;
  }
}

export const phoneSerializer = new PhonePayloadSerializer();
