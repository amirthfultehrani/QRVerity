import { PayloadIssue, PayloadSerializer, PayloadValidationResult } from './types';

export interface CalendarPayloadInput {
  title: string;
  start: Date | string;
  end?: Date | string | undefined;
  location?: string | undefined;
  description?: string | undefined;
}

export interface CalendarPayloadNormalized {
  title: string;
  start: Date;
  end?: Date | undefined;
  location?: string | undefined;
  description?: string | undefined;
}

export const MAX_CALENDAR_TITLE_LENGTH = 256;
export const MAX_CALENDAR_LOCATION_LENGTH = 256;
export const MAX_CALENDAR_DESCRIPTION_LENGTH = 1000;

/**
 * Formats a Date object to UTC iCalendar format YYYYMMDDTHHMMSSZ
 */
export function formatICalDate(date: Date): string {
  const pad = (num: number) => String(num).padStart(2, '0');

  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const mins = pad(date.getUTCMinutes());
  const secs = pad(date.getUTCSeconds());

  return `${year}${month}${day}T${hours}${mins}${secs}Z`;
}

/**
 * Escapes special iCalendar text characters: \, ;, ,, newlines
 */
export function escapeICalText(value: string): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Calendar Event Payload Serializer & Validator
 */
export class CalendarPayloadSerializer implements PayloadSerializer<
  CalendarPayloadInput,
  CalendarPayloadNormalized
> {
  public readonly type = 'calendar';

  public validate(input: CalendarPayloadInput): PayloadValidationResult<CalendarPayloadNormalized> {
    const issues: PayloadIssue[] = [];

    if (!input) {
      return {
        valid: false,
        issues: [
          {
            code: 'INVALID_INPUT',
            message: 'Calendar input is required',
            severity: 'error',
          },
        ],
      };
    }

    // 1. Validate Title
    if (typeof input.title !== 'string' || input.title.trim().length === 0) {
      issues.push({
        code: 'EMPTY_TITLE',
        message: 'Event title is required',
        field: 'title',
        severity: 'error',
      });
    } else if (input.title.length > MAX_CALENDAR_TITLE_LENGTH) {
      issues.push({
        code: 'TITLE_TOO_LONG',
        message: `Title exceeds maximum length of ${MAX_CALENDAR_TITLE_LENGTH} characters`,
        field: 'title',
        severity: 'error',
      });
    }

    // 2. Validate Start Date
    const parseDate = (val: Date | string): Date | null => {
      if (val instanceof Date) {
        return isNaN(val.getTime()) ? null : val;
      }
      if (typeof val === 'string' && val.trim() !== '') {
        const d = new Date(val.trim());
        return isNaN(d.getTime()) ? null : d;
      }
      return null;
    };

    const startDate = parseDate(input.start);
    if (!startDate) {
      issues.push({
        code: 'INVALID_START_DATE',
        message: 'Event start date/time is invalid or missing',
        field: 'start',
        severity: 'error',
      });
    }

    // 3. Validate End Date
    let endDate: Date | undefined;
    if (input.end !== undefined && input.end !== null && input.end !== '') {
      const parsedEnd = parseDate(input.end);
      if (!parsedEnd) {
        issues.push({
          code: 'INVALID_END_DATE',
          message: 'Event end date/time is invalid',
          field: 'end',
          severity: 'error',
        });
      } else {
        endDate = parsedEnd;
      }
    }

    if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
      issues.push({
        code: 'END_BEFORE_START',
        message: 'Event end date cannot be before start date',
        field: 'end',
        severity: 'error',
      });
    }

    // 4. Validate Location
    const location = typeof input.location === 'string' ? input.location.trim() : '';
    if (location.length > MAX_CALENDAR_LOCATION_LENGTH) {
      issues.push({
        code: 'LOCATION_TOO_LONG',
        message: `Location exceeds maximum length of ${MAX_CALENDAR_LOCATION_LENGTH} characters`,
        field: 'location',
        severity: 'error',
      });
    }

    // 5. Validate Description
    const description = typeof input.description === 'string' ? input.description.trim() : '';
    if (description.length > MAX_CALENDAR_DESCRIPTION_LENGTH) {
      issues.push({
        code: 'DESCRIPTION_TOO_LONG',
        message: `Description exceeds maximum length of ${MAX_CALENDAR_DESCRIPTION_LENGTH} characters`,
        field: 'description',
        severity: 'error',
      });
    }

    if (issues.length > 0) {
      return { valid: false, issues };
    }

    const normalized: CalendarPayloadNormalized = {
      title: input.title.trim(),
      start: startDate!,
      end: endDate,
      location: location || undefined,
      description: description || undefined,
    };

    return {
      valid: true,
      normalized,
      issues: [],
    };
  }

  public serialize(normalized: CalendarPayloadNormalized): string {
    if (!normalized || !normalized.title || !normalized.start) {
      throw new Error('Invalid normalized input for Calendar serialization');
    }

    const lines: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT'];

    lines.push(`SUMMARY:${escapeICalText(normalized.title)}`);
    lines.push(`DTSTART:${formatICalDate(normalized.start)}`);

    if (normalized.end) {
      lines.push(`DTEND:${formatICalDate(normalized.end)}`);
    }

    if (normalized.location) {
      lines.push(`LOCATION:${escapeICalText(normalized.location)}`);
    }

    if (normalized.description) {
      lines.push(`DESCRIPTION:${escapeICalText(normalized.description)}`);
    }

    lines.push('END:VEVENT', 'END:VCALENDAR');

    return lines.join('\r\n');
  }
}

export const calendarSerializer = new CalendarPayloadSerializer();
