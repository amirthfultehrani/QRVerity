import { PayloadIssue, PayloadSerializer, PayloadValidationResult } from './types';

export interface EmailPayloadInput {
  to: string;
  subject?: string | undefined;
  body?: string | undefined;
}

export interface EmailPayloadNormalized {
  to: string;
  subject?: string | undefined;
  body?: string | undefined;
}

export const MAX_EMAIL_TO_LENGTH = 254;
export const MAX_EMAIL_SUBJECT_LENGTH = 256;
export const MAX_EMAIL_BODY_LENGTH = 2048;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Email Payload Serializer & Validator
 */
export class EmailPayloadSerializer implements PayloadSerializer<
  EmailPayloadInput,
  EmailPayloadNormalized
> {
  public readonly type = 'email';

  public validate(input: EmailPayloadInput): PayloadValidationResult<EmailPayloadNormalized> {
    const issues: PayloadIssue[] = [];

    if (!input || typeof input.to !== 'string') {
      return {
        valid: false,
        issues: [
          {
            code: 'INVALID_INPUT',
            message: 'Email address "to" is required and must be a string',
            field: 'to',
            severity: 'error',
          },
        ],
      };
    }

    const trimmedTo = input.to.trim();

    if (trimmedTo.length === 0) {
      issues.push({
        code: 'EMPTY_EMAIL_TO',
        message: 'Recipient email address cannot be empty',
        field: 'to',
        severity: 'error',
      });
    } else if (trimmedTo.length > MAX_EMAIL_TO_LENGTH) {
      issues.push({
        code: 'EMAIL_TO_TOO_LONG',
        message: `Recipient email exceeds maximum length of ${MAX_EMAIL_TO_LENGTH} characters`,
        field: 'to',
        severity: 'error',
      });
    } else if (!EMAIL_REGEX.test(trimmedTo)) {
      issues.push({
        code: 'INVALID_EMAIL_SYNTAX',
        message: `Email address "${input.to}" is not a valid email address format`,
        field: 'to',
        severity: 'error',
      });
    }

    const subject = input.subject ?? '';
    if (subject.length > MAX_EMAIL_SUBJECT_LENGTH) {
      issues.push({
        code: 'EMAIL_SUBJECT_TOO_LONG',
        message: `Email subject exceeds maximum length of ${MAX_EMAIL_SUBJECT_LENGTH} characters`,
        field: 'subject',
        severity: 'error',
      });
    }

    const body = input.body ?? '';
    if (body.length > MAX_EMAIL_BODY_LENGTH) {
      issues.push({
        code: 'EMAIL_BODY_TOO_LONG',
        message: `Email body exceeds maximum length of ${MAX_EMAIL_BODY_LENGTH} characters`,
        field: 'body',
        severity: 'error',
      });
    }

    if (issues.length > 0) {
      return { valid: false, issues };
    }

    const lastAtIndex = trimmedTo.lastIndexOf('@');
    const localPart = lastAtIndex > 0 ? trimmedTo.slice(0, lastAtIndex) : trimmedTo;
    const domainPart = lastAtIndex > 0 ? trimmedTo.slice(lastAtIndex + 1).toLowerCase() : '';
    const normalizedTo = lastAtIndex > 0 ? `${localPart}@${domainPart}` : trimmedTo;

    return {
      valid: true,
      normalized: {
        to: normalizedTo,
        subject: subject.length > 0 ? subject : undefined,
        body: body.length > 0 ? body : undefined,
      },
      issues: [],
    };
  }

  public serialize(normalized: EmailPayloadNormalized): string {
    if (!normalized || typeof normalized.to !== 'string') {
      throw new Error('Invalid normalized input for Email serialization');
    }

    let uri = `mailto:${normalized.to}`;
    const queryParams: string[] = [];

    if (normalized.subject) {
      queryParams.push(`subject=${encodeURIComponent(normalized.subject)}`);
    }

    if (normalized.body) {
      queryParams.push(`body=${encodeURIComponent(normalized.body)}`);
    }

    if (queryParams.length > 0) {
      uri += `?${queryParams.join('&')}`;
    }

    return uri;
  }
}

export const emailSerializer = new EmailPayloadSerializer();
