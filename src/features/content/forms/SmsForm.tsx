import { PayloadIssue } from '../../../payloads/types';
import { SmsPayloadInput } from '../../../payloads/sms';
import { updatePayloadInput } from '../../../state/generator';

interface SmsFormProps {
  input: SmsPayloadInput;
  issues: readonly PayloadIssue[];
}

export function SmsForm({ input, issues }: SmsFormProps) {
  const numberIssue = issues.find((i) => i.field === 'number');
  const messageIssue = issues.find((i) => i.field === 'message');

  return (
    <div class="form-stack">
      <div class="form-group">
        <label htmlFor="sms-number" class="form-label">
          Recipient Phone Number
        </label>
        <input
          id="sms-number"
          type="tel"
          class={`form-control ${numberIssue ? 'is-invalid' : ''}`}
          value={input.number || ''}
          onInput={(e) =>
            updatePayloadInput<SmsPayloadInput>('sms', {
              number: (e.target as HTMLInputElement).value,
            })
          }
          placeholder="+1 (555) 019-2834"
          aria-describedby={numberIssue ? 'sms-number-error' : undefined}
          aria-invalid={Boolean(numberIssue)}
          required
        />
        {numberIssue && (
          <p id="sms-number-error" class="form-error" role="alert">
            {numberIssue.message}
          </p>
        )}
      </div>

      <div class="form-group">
        <label htmlFor="sms-message" class="form-label">
          SMS Message (Optional)
        </label>
        <textarea
          id="sms-message"
          class={`form-control ${messageIssue ? 'is-invalid' : ''}`}
          rows={3}
          value={input.message || ''}
          onInput={(e) =>
            updatePayloadInput<SmsPayloadInput>('sms', {
              message: (e.target as HTMLTextAreaElement).value,
            })
          }
          placeholder="Preset text message..."
          aria-describedby={messageIssue ? 'sms-message-error' : undefined}
          aria-invalid={Boolean(messageIssue)}
        />
        {messageIssue && (
          <p id="sms-message-error" class="form-error" role="alert">
            {messageIssue.message}
          </p>
        )}
      </div>
    </div>
  );
}
