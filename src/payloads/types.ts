/**
 * PureQR Payload Domain Types & Common Serializer Contracts
 *
 * Provides strongly typed contracts for payload validation, issue reporting,
 * and deterministic payload string serialization.
 */

export type PayloadType =
  'url' | 'text' | 'wifi' | 'email' | 'phone' | 'sms' | 'vcard' | 'geo' | 'calendar';

export interface PayloadIssue {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly severity: 'error' | 'warning';
}

export interface PayloadValidationResult<TNormalized> {
  readonly valid: boolean;
  readonly normalized?: TNormalized;
  readonly issues: readonly PayloadIssue[];
}

export interface PayloadSerializer<TInput, TNormalized = TInput> {
  readonly type: PayloadType;
  validate(input: TInput): PayloadValidationResult<TNormalized>;
  serialize(normalized: TNormalized): string;
}
