import { PayloadIssue } from '../../../payloads/types';
import { PhonePayloadInput } from '../../../payloads/phone';
import { updatePayloadInput } from '../../../state/generator';

interface PhoneFormProps {
  input: PhonePayloadInput;
  issues: readonly PayloadIssue[];
}

export function PhoneForm({ input, issues }: PhoneFormProps) {
  const numberIssue = issues.find((i) => i.field === 'number' || i.code === 'INVALID_INPUT');

  return (
    <div class="form-group">
      <label htmlFor="phone-number" class="form-label">
        Phone Number
      </label>
      <input
        id="phone-number"
        type="tel"
        class={`form-control ${numberIssue ? 'is-invalid' : ''}`}
        value={input.number || ''}
        onInput={(e) =>
          updatePayloadInput<PhonePayloadInput>('phone', {
            number: (e.target as HTMLInputElement).value,
          })
        }
        placeholder="+1 (555) 019-2834"
        aria-describedby={numberIssue ? 'phone-error' : undefined}
        aria-invalid={Boolean(numberIssue)}
        required
      />
      {numberIssue && (
        <p id="phone-error" class="form-error" role="alert">
          {numberIssue.message}
        </p>
      )}
    </div>
  );
}
