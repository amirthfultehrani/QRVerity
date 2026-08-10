import { PayloadIssue } from '../../../payloads/types';
import { CalendarPayloadInput } from '../../../payloads/calendar';
import { updatePayloadInput } from '../../../state/generator';

interface CalendarFormProps {
  input: CalendarPayloadInput;
  issues: readonly PayloadIssue[];
}

export function CalendarForm({ input, issues }: CalendarFormProps) {
  const titleIssue = issues.find((i) => i.field === 'title');
  const startIssue = issues.find((i) => i.field === 'start');
  const endIssue = issues.find((i) => i.field === 'end');
  const locationIssue = issues.find((i) => i.field === 'location');
  const descriptionIssue = issues.find((i) => i.field === 'description');

  const formatDatetimeLocal = (val: Date | string | undefined): string => {
    if (!val) return '';
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div class="form-stack">
      <div class="form-group">
        <label htmlFor="calendar-title" class="form-label">
          Event Title
        </label>
        <input
          id="calendar-title"
          type="text"
          class={`form-control ${titleIssue ? 'is-invalid' : ''}`}
          value={input.title || ''}
          onInput={(e) =>
            updatePayloadInput<CalendarPayloadInput>('calendar', {
              title: (e.target as HTMLInputElement).value,
            })
          }
          placeholder="e.g. Project Kickoff"
          aria-describedby={titleIssue ? 'calendar-title-error' : undefined}
          aria-invalid={Boolean(titleIssue)}
          required
        />
        {titleIssue && (
          <p id="calendar-title-error" class="form-error" role="alert">
            {titleIssue.message}
          </p>
        )}
      </div>

      <div class="form-grid-2">
        <div class="form-group">
          <label htmlFor="calendar-start" class="form-label">
            Start Date & Time
          </label>
          <input
            id="calendar-start"
            type="datetime-local"
            class={`form-control ${startIssue ? 'is-invalid' : ''}`}
            value={formatDatetimeLocal(input.start)}
            onInput={(e) => {
              const val = (e.target as HTMLInputElement).value;
              updatePayloadInput<CalendarPayloadInput>('calendar', {
                start: val ? new Date(val) : '',
              });
            }}
            aria-describedby={startIssue ? 'calendar-start-error' : undefined}
            aria-invalid={Boolean(startIssue)}
            required
          />
          {startIssue && (
            <p id="calendar-start-error" class="form-error" role="alert">
              {startIssue.message}
            </p>
          )}
        </div>

        <div class="form-group">
          <label htmlFor="calendar-end" class="form-label">
            End Date & Time (Optional)
          </label>
          <input
            id="calendar-end"
            type="datetime-local"
            class={`form-control ${endIssue ? 'is-invalid' : ''}`}
            value={formatDatetimeLocal(input.end)}
            onInput={(e) => {
              const val = (e.target as HTMLInputElement).value;
              updatePayloadInput<CalendarPayloadInput>('calendar', {
                end: val ? new Date(val) : undefined,
              });
            }}
            aria-describedby={endIssue ? 'calendar-end-error' : undefined}
            aria-invalid={Boolean(endIssue)}
          />
          {endIssue && (
            <p id="calendar-end-error" class="form-error" role="alert">
              {endIssue.message}
            </p>
          )}
        </div>
      </div>

      <div class="form-group">
        <label htmlFor="calendar-location" class="form-label">
          Location (Optional)
        </label>
        <input
          id="calendar-location"
          type="text"
          class={`form-control ${locationIssue ? 'is-invalid' : ''}`}
          value={input.location || ''}
          onInput={(e) =>
            updatePayloadInput<CalendarPayloadInput>('calendar', {
              location: (e.target as HTMLInputElement).value,
            })
          }
          placeholder="e.g. Conference Room A or Zoom Link"
          aria-describedby={locationIssue ? 'calendar-location-error' : undefined}
          aria-invalid={Boolean(locationIssue)}
        />
        {locationIssue && (
          <p id="calendar-location-error" class="form-error" role="alert">
            {locationIssue.message}
          </p>
        )}
      </div>

      <div class="form-group">
        <label htmlFor="calendar-description" class="form-label">
          Description (Optional)
        </label>
        <textarea
          id="calendar-description"
          class={`form-control ${descriptionIssue ? 'is-invalid' : ''}`}
          rows={3}
          value={input.description || ''}
          onInput={(e) =>
            updatePayloadInput<CalendarPayloadInput>('calendar', {
              description: (e.target as HTMLTextAreaElement).value,
            })
          }
          placeholder="Agenda and notes..."
          aria-describedby={descriptionIssue ? 'calendar-description-error' : undefined}
          aria-invalid={Boolean(descriptionIssue)}
        />
        {descriptionIssue && (
          <p id="calendar-description-error" class="form-error" role="alert">
            {descriptionIssue.message}
          </p>
        )}
      </div>
    </div>
  );
}
