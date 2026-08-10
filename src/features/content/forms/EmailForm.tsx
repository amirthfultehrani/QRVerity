import { PayloadIssue } from '../../../payloads/types';
import { EmailPayloadInput } from '../../../payloads/email';
import { updatePayloadInput } from '../../../state/generator';

interface EmailFormProps {
  input: EmailPayloadInput;
  issues: readonly PayloadIssue[];
}

export function EmailForm({ input, issues }: EmailFormProps) {
  const toIssue = issues.find((i) => i.field === 'to');
  const subjectIssue = issues.find((i) => i.field === 'subject');
  const bodyIssue = issues.find((i) => i.field === 'body');

  return (
    <div class="form-stack">
      <div class="form-group">
        <label htmlFor="email-to" class="form-label">
          Recipient Email
        </label>
        <input
          id="email-to"
          type="email"
          class={`form-control ${toIssue ? 'is-invalid' : ''}`}
          value={input.to || ''}
          onInput={(e) =>
            updatePayloadInput<EmailPayloadInput>('email', {
              to: (e.target as HTMLInputElement).value,
            })
          }
          placeholder="user@example.com"
          aria-describedby={toIssue ? 'email-to-error' : undefined}
          aria-invalid={Boolean(toIssue)}
          required
        />
        {toIssue && (
          <p id="email-to-error" class="form-error" role="alert">
            {toIssue.message}
          </p>
        )}
        {!toIssue && (
          <p class="form-hint">Scanning the QR code will open an email to this address</p>
        )}
      </div>

      <div class="form-group">
        <label htmlFor="email-subject" class="form-label">
          Subject (Optional)
        </label>
        <input
          id="email-subject"
          type="text"
          class={`form-control ${subjectIssue ? 'is-invalid' : ''}`}
          value={input.subject || ''}
          onInput={(e) =>
            updatePayloadInput<EmailPayloadInput>('email', {
              subject: (e.target as HTMLInputElement).value,
            })
          }
          placeholder="e.g. Question regarding project"
          aria-describedby={subjectIssue ? 'email-subject-error' : undefined}
          aria-invalid={Boolean(subjectIssue)}
        />
        {subjectIssue && (
          <p id="email-subject-error" class="form-error" role="alert">
            {subjectIssue.message}
          </p>
        )}
      </div>

      <div class="form-group">
        <label htmlFor="email-body" class="form-label">
          Message Body (Optional)
        </label>
        <textarea
          id="email-body"
          class={`form-control ${bodyIssue ? 'is-invalid' : ''}`}
          rows={4}
          value={input.body || ''}
          onInput={(e) =>
            updatePayloadInput<EmailPayloadInput>('email', {
              body: (e.target as HTMLTextAreaElement).value,
            })
          }
          placeholder="Write your email body message..."
          aria-describedby={bodyIssue ? 'email-body-error' : undefined}
          aria-invalid={Boolean(bodyIssue)}
        />
        {bodyIssue && (
          <p id="email-body-error" class="form-error" role="alert">
            {bodyIssue.message}
          </p>
        )}
      </div>
    </div>
  );
}
