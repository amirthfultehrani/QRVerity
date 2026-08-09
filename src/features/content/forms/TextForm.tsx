import { PayloadIssue } from '../../../payloads/types';
import { MAX_TEXT_LENGTH, TextPayloadInput } from '../../../payloads/text';
import { updatePayloadInput } from '../../../state/generator';

interface TextFormProps {
  input: TextPayloadInput;
  issues: readonly PayloadIssue[];
}

export function TextForm({ input, issues }: TextFormProps) {
  const rawIssue = issues.find((i) => i.field === 'text' || i.code === 'INVALID_INPUT');
  const isEmpty = !(input?.text || '').trim();
  const textIssue = rawIssue && (rawIssue.code !== 'EMPTY_TEXT' || !isEmpty) ? rawIssue : undefined;
  const currentLength = (input?.text || '').length;

  return (
    <div class="form-group">
      <div class="form-label-row">
        <label htmlFor="text-input" class="form-label">
          Plain Text
        </label>
        <span class="character-count" aria-live="polite">
          {currentLength} / {MAX_TEXT_LENGTH}
        </span>
      </div>
      <textarea
        id="text-input"
        class={`form-control ${textIssue ? 'is-invalid' : ''}`}
        rows={5}
        value={input?.text || ''}
        onInput={(e) =>
          updatePayloadInput<TextPayloadInput>('text', {
            text: (e.target as HTMLTextAreaElement).value,
          })
        }
        placeholder="Enter plain text, notes, or messages..."
        aria-describedby={textIssue ? 'text-error' : undefined}
        aria-invalid={Boolean(textIssue)}
        required
      />
      {textIssue && (
        <p id="text-error" class="form-error" role="alert">
          {textIssue.message}
        </p>
      )}
    </div>
  );
}
