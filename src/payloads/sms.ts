import { PhonePayloadSerializer } from './phone';
import { PayloadIssue, PayloadSerializer, PayloadValidationResult } from './types';

export interface SmsPayloadInput {
  number: string;
  message?: string | undefined;
}

export interface SmsPayloadNormalized {
  number: string;
  message?: string | undefined;
}

export const MAX_SMS_MESSAGE_LENGTH = 1600;

/**
 * SMS Payload Serializer & Validator
 *
 * Output Syntax: Standard RFC 5724 SMS URI format: `sms:<number>?body=<message>`
 * (or `sms:<number>` when message is omitted).
 */
export class SmsPayloadSerializer implements PayloadSerializer<
  SmsPayloadInput,
  SmsPayloadNormalized
> {
  public readonly type = 'sms';

  private readonly phoneSerializer = new PhonePayloadSerializer();

  public validate(input: SmsPayloadInput): PayloadValidationResult<SmsPayloadNormalized> {
    const issues: PayloadIssue[] = [];

    if (!input) {
      return {
        valid: false,
        issues: [
          {
            code: 'INVALID_INPUT',
            message: 'SMS input is required',
            severity: 'error',
          },
        ],
      };
    }

    // Validate phone number component
    const phoneResult = this.phoneSerializer.validate({ number: input.number });
    if (!phoneResult.valid) {
      issues.push(...phoneResult.issues);
    }

    const message = input.message ?? '';
    if (message.length > MAX_SMS_MESSAGE_LENGTH) {
      issues.push({
        code: 'SMS_MESSAGE_TOO_LONG',
        message: `SMS message exceeds maximum length of ${MAX_SMS_MESSAGE_LENGTH} characters`,
        field: 'message',
        severity: 'error',
      });
    }

    if (issues.length > 0) {
      return { valid: false, issues };
    }

    return {
      valid: true,
      normalized: {
        number: phoneResult.normalized!.number,
        message: message.length > 0 ? message : undefined,
      },
      issues: [],
    };
  }

  public serialize(normalized: SmsPayloadNormalized): string {
    if (!normalized || typeof normalized.number !== 'string') {
      throw new Error('Invalid normalized input for SMS serialization');
    }

    let uri = `sms:${normalized.number}`;

    if (normalized.message) {
      uri += `?body=${encodeURIComponent(normalized.message)}`;
    }

    return uri;
  }
}

export const smsSerializer = new SmsPayloadSerializer();
