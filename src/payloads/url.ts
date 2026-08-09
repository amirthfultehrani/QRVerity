import { PayloadIssue, PayloadSerializer, PayloadValidationResult } from './types';

export interface UrlPayloadInput {
  url: string;
}

export interface UrlPayloadNormalized {
  url: string;
}

export const MAX_URL_LENGTH = 2048;

/**
 * URL Payload Serializer & Validator
 */
export class UrlPayloadSerializer implements PayloadSerializer<
  UrlPayloadInput,
  UrlPayloadNormalized
> {
  public readonly type = 'url';

  public validate(input: UrlPayloadInput): PayloadValidationResult<UrlPayloadNormalized> {
    const issues: PayloadIssue[] = [];

    if (!input || typeof input.url !== 'string') {
      return {
        valid: false,
        issues: [
          {
            code: 'INVALID_INPUT',
            message: 'URL must be a string',
            field: 'url',
            severity: 'error',
          },
        ],
      };
    }

    const trimmed = input.url.trim();

    if (trimmed.length === 0) {
      return {
        valid: false,
        issues: [
          {
            code: 'EMPTY_URL',
            message: 'URL cannot be empty',
            field: 'url',
            severity: 'error',
          },
        ],
      };
    }

    if (trimmed.length > MAX_URL_LENGTH) {
      return {
        valid: false,
        issues: [
          {
            code: 'URL_TOO_LONG',
            message: `URL exceeds maximum length of ${MAX_URL_LENGTH} characters`,
            field: 'url',
            severity: 'error',
          },
        ],
      };
    }

    try {
      const parsed = new URL(trimmed);
      const protocol = parsed.protocol.toLowerCase();

      if (protocol !== 'http:' && protocol !== 'https:') {
        issues.push({
          code: 'UNSUPPORTED_SCHEME',
          message: `URL scheme "${protocol}" is not allowed. Only http: and https: are supported.`,
          field: 'url',
          severity: 'error',
        });
        return { valid: false, issues };
      }

      return {
        valid: true,
        normalized: { url: parsed.toString() },
        issues: [],
      };
    } catch {
      return {
        valid: false,
        issues: [
          {
            code: 'INVALID_URL_SYNTAX',
            message: 'URL string is not a valid URL format',
            field: 'url',
            severity: 'error',
          },
        ],
      };
    }
  }

  public serialize(normalized: UrlPayloadNormalized): string {
    if (!normalized || typeof normalized.url !== 'string') {
      throw new Error('Invalid normalized input for URL serialization');
    }
    return normalized.url;
  }
}

export const urlSerializer = new UrlPayloadSerializer();
