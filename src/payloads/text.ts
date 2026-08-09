import { PayloadIssue, PayloadSerializer, PayloadValidationResult } from './types';

export interface TextPayloadInput {
  text: string;
}

export interface TextPayloadNormalized {
  text: string;
}

export const MAX_TEXT_LENGTH = 4096;

/**
 * Plain Text Payload Serializer & Validator
 */
export class TextPayloadSerializer implements PayloadSerializer<
  TextPayloadInput,
  TextPayloadNormalized
> {
  public readonly type = 'text';

  public validate(input: TextPayloadInput): PayloadValidationResult<TextPayloadNormalized> {
    if (!input || typeof input.text !== 'string') {
      return {
        valid: false,
        issues: [
          {
            code: 'INVALID_INPUT',
            message: 'Text must be a string',
            field: 'text',
            severity: 'error',
          },
        ],
      };
    }

    if (input.text.trim().length === 0) {
      return {
        valid: false,
        issues: [
          {
            code: 'EMPTY_TEXT',
            message: 'Text content cannot be empty',
            field: 'text',
            severity: 'error',
          },
        ],
      };
    }

    if (input.text.length > MAX_TEXT_LENGTH) {
      const issues: PayloadIssue[] = [
        {
          code: 'TEXT_TOO_LONG',
          message: `Text exceeds maximum limit of ${MAX_TEXT_LENGTH} characters`,
          field: 'text',
          severity: 'error',
        },
      ];
      return { valid: false, issues };
    }

    return {
      valid: true,
      normalized: { text: input.text },
      issues: [],
    };
  }

  public serialize(normalized: TextPayloadNormalized): string {
    if (!normalized || typeof normalized.text !== 'string') {
      throw new Error('Invalid normalized input for Text serialization');
    }
    return normalized.text;
  }
}

export const textSerializer = new TextPayloadSerializer();
