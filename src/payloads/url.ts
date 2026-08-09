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

    // Smart auto-prefix: if input looks like a bare domain, prepend https:// (or http:// for local)
    let candidate = trimmed;
    if (!/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(candidate) && !/^[a-zA-Z]+:/.test(candidate)) {
      // Looks like it might be a bare domain (has a dot, no spaces before the first slash)
      const prePath = candidate.split('/')[0] ?? '';
      
      const isLocalhost = prePath.startsWith('localhost') || prePath.startsWith('127.0.0.1') || prePath.startsWith('[::1]');
      const isLocalIp = /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(prePath);

      if ((prePath.includes('.') || isLocalhost) && !/\s/.test(prePath)) {
        const scheme = (isLocalhost || isLocalIp) ? 'http' : 'https';
        candidate = `${scheme}://${candidate}`;
      }
    }

    try {
      const parsed = new URL(candidate);
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
