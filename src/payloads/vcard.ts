import { PayloadIssue, PayloadSerializer, PayloadValidationResult } from './types';

export interface VCardPayloadInput {
  firstName?: string | undefined;
  lastName?: string | undefined;
  organization?: string | undefined;
  title?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
  website?: string | undefined;
  street?: string | undefined;
  city?: string | undefined;
  region?: string | undefined;
  postalCode?: string | undefined;
  country?: string | undefined;
  note?: string | undefined;
}

export interface VCardPayloadNormalized {
  firstName?: string | undefined;
  lastName?: string | undefined;
  organization?: string | undefined;
  title?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
  website?: string | undefined;
  street?: string | undefined;
  city?: string | undefined;
  region?: string | undefined;
  postalCode?: string | undefined;
  country?: string | undefined;
  note?: string | undefined;
}

export const MAX_VCARD_FIELD_LENGTH = 128;
export const MAX_VCARD_NOTE_LENGTH = 1000;

/**
 * Escapes vCard 3.0 special characters: \, ;, ,, newlines
 */
export function escapeVCardValue(value: string): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * vCard 3.0 Payload Serializer & Validator
 */
export class VCardPayloadSerializer implements PayloadSerializer<
  VCardPayloadInput,
  VCardPayloadNormalized
> {
  public readonly type = 'vcard';

  public validate(input: VCardPayloadInput): PayloadValidationResult<VCardPayloadNormalized> {
    const issues: PayloadIssue[] = [];

    if (!input) {
      return {
        valid: false,
        issues: [
          {
            code: 'INVALID_INPUT',
            message: 'vCard input is required',
            severity: 'error',
          },
        ],
      };
    }

    const cleanField = (val?: string) => (typeof val === 'string' ? val.trim() : '');

    const firstName = cleanField(input.firstName);
    const lastName = cleanField(input.lastName);
    const organization = cleanField(input.organization);
    const title = cleanField(input.title);
    const phone = cleanField(input.phone);
    const email = cleanField(input.email);
    const website = cleanField(input.website);
    const street = cleanField(input.street);
    const city = cleanField(input.city);
    const region = cleanField(input.region);
    const postalCode = cleanField(input.postalCode);
    const country = cleanField(input.country);
    const note = cleanField(input.note);

    // Require at least one contact identifier
    if (!firstName && !lastName && !organization && !phone && !email) {
      issues.push({
        code: 'MISSING_CONTACT_IDENTIFIER',
        message:
          'vCard requires at least one of: first name, last name, organization, phone, or email.',
        severity: 'error',
      });
    }

    // Check individual field lengths
    const fieldMap: Record<string, string> = {
      firstName,
      lastName,
      organization,
      title,
      phone,
      email,
      website,
      street,
      city,
      region,
      postalCode,
      country,
    };

    for (const [key, val] of Object.entries(fieldMap)) {
      if (val.length > MAX_VCARD_FIELD_LENGTH) {
        issues.push({
          code: 'FIELD_TOO_LONG',
          message: `vCard field "${key}" exceeds maximum limit of ${MAX_VCARD_FIELD_LENGTH} characters`,
          field: key,
          severity: 'error',
        });
      }
    }

    if (note.length > MAX_VCARD_NOTE_LENGTH) {
      issues.push({
        code: 'NOTE_TOO_LONG',
        message: `vCard note exceeds maximum limit of ${MAX_VCARD_NOTE_LENGTH} characters`,
        field: 'note',
        severity: 'error',
      });
    }

    if (issues.length > 0) {
      return { valid: false, issues };
    }

    const normalized: VCardPayloadNormalized = {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      organization: organization || undefined,
      title: title || undefined,
      phone: phone || undefined,
      email: email || undefined,
      website: website || undefined,
      street: street || undefined,
      city: city || undefined,
      region: region || undefined,
      postalCode: postalCode || undefined,
      country: country || undefined,
      note: note || undefined,
    };

    return {
      valid: true,
      normalized,
      issues: [],
    };
  }

  public serialize(n: VCardPayloadNormalized): string {
    if (!n) {
      throw new Error('Invalid normalized input for vCard serialization');
    }

    const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];

    const first = n.firstName ? escapeVCardValue(n.firstName) : '';
    const last = n.lastName ? escapeVCardValue(n.lastName) : '';

    // N:FamilyName;GivenName;AdditionalNames;HonorificPrefixes;HonorificSuffixes
    lines.push(`N:${last};${first};;;`);

    // FN: Formatted Name
    const fnParts = [n.firstName, n.lastName].filter(Boolean);
    const fnStr = fnParts.length > 0 ? fnParts.join(' ') : n.organization || 'Contact';
    lines.push(`FN:${escapeVCardValue(fnStr)}`);

    if (n.organization) {
      lines.push(`ORG:${escapeVCardValue(n.organization)}`);
    }

    if (n.title) {
      lines.push(`TITLE:${escapeVCardValue(n.title)}`);
    }

    if (n.phone) {
      lines.push(`TEL:${escapeVCardValue(n.phone)}`);
    }

    if (n.email) {
      lines.push(`EMAIL:${escapeVCardValue(n.email)}`);
    }

    if (n.website) {
      lines.push(`URL:${escapeVCardValue(n.website)}`);
    }

    // ADR: poBox;extendedAddress;street;city;region;postalCode;country
    if (n.street || n.city || n.region || n.postalCode || n.country) {
      const street = n.street ? escapeVCardValue(n.street) : '';
      const city = n.city ? escapeVCardValue(n.city) : '';
      const region = n.region ? escapeVCardValue(n.region) : '';
      const postal = n.postalCode ? escapeVCardValue(n.postalCode) : '';
      const country = n.country ? escapeVCardValue(n.country) : '';

      lines.push(`ADR:;;${street};${city};${region};${postal};${country}`);
    }

    if (n.note) {
      lines.push(`NOTE:${escapeVCardValue(n.note)}`);
    }

    lines.push('END:VCARD');

    return lines.join('\r\n');
  }
}

export const vCardSerializer = new VCardPayloadSerializer();
