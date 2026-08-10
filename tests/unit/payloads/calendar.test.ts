import { describe, expect, it } from 'vitest';
import { calendarSerializer, escapeICalText, formatICalDate } from '../../../src/payloads/calendar';

describe('Calendar Event Payload Serializer', () => {
  it('formats dates in UTC ISO iCalendar format (YYYYMMDDTHHMMSSZ)', () => {
    const d = new Date(Date.UTC(2026, 7, 8, 12, 30, 45)); // August 8, 2026, 12:30:45 UTC
    expect(formatICalDate(d)).toBe('20260808T123045Z');
  });

  it('escapes reserved iCalendar text characters', () => {
    expect(escapeICalText('Meeting; Room A')).toBe('Meeting\\; Room A');
    expect(escapeICalText('Item 1, Item 2')).toBe('Item 1\\, Item 2');
    expect(escapeICalText('Notes:\nLine 1\nLine 2')).toBe('Notes:\\nLine 1\\nLine 2');
    expect(escapeICalText('C:\\Docs\\Plan')).toBe('C:\\\\Docs\\\\Plan');
  });

  it('serializes iCalendar 2.0 VEVENT with title, dates, location, and description', () => {
    const start = new Date(Date.UTC(2026, 7, 8, 14, 0, 0));
    const end = new Date(Date.UTC(2026, 7, 8, 15, 30, 0));

    const res = calendarSerializer.validate({
      title: 'Project Kickoff; Q3',
      start,
      end,
      location: 'Conference Room 1, Floor 2',
      description: 'Discuss Phase 3:\n- Serializers\n- Integration',
    });

    expect(res.valid).toBe(true);
    const serialized = calendarSerializer.serialize(res.normalized!);

    const expected = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'SUMMARY:Project Kickoff\\; Q3',
      'DTSTART:20260808T140000Z',
      'DTEND:20260808T153000Z',
      'LOCATION:Conference Room 1\\, Floor 2',
      'DESCRIPTION:Discuss Phase 3:\\n- Serializers\\n- Integration',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    expect(serialized).toBe(expected);
  });

  it('serializes event with start date only', () => {
    const start = new Date(Date.UTC(2026, 11, 25, 0, 0, 0));
    const res = calendarSerializer.validate({
      title: 'Christmas',
      start,
    });

    expect(res.valid).toBe(true);
    const serialized = calendarSerializer.serialize(res.normalized!);

    const expected = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'SUMMARY:Christmas',
      'DTSTART:20261225T000000Z',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    expect(serialized).toBe(expected);
  });

  it('rejects event when end date is before start date', () => {
    const start = new Date(Date.UTC(2026, 7, 8, 15, 0, 0));
    const end = new Date(Date.UTC(2026, 7, 8, 14, 0, 0));

    const res = calendarSerializer.validate({
      title: 'Invalid Time',
      start,
      end,
    });

    expect(res.valid).toBe(false);
    expect(res.issues[0]?.code).toBe('END_BEFORE_START');
  });

  it('rejects empty title or invalid start date', () => {
    const res1 = calendarSerializer.validate({ title: '', start: new Date() });
    expect(res1.valid).toBe(false);
    expect(res1.issues[0]?.code).toBe('EMPTY_TITLE');

    const res2 = calendarSerializer.validate({ title: 'Event', start: 'invalid-date' });
    expect(res2.valid).toBe(false);
    expect(res2.issues[0]?.code).toBe('INVALID_START_DATE');
  });
});
