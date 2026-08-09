import { PayloadIssue } from '../../../payloads/types';
import { UrlPayloadInput } from '../../../payloads/url';
import { updatePayloadInput } from '../../../state/generator';

interface UrlFormProps {
  input: UrlPayloadInput;
  issues: readonly PayloadIssue[];
}

export function UrlForm({ input, issues }: UrlFormProps) {
  const rawIssue = issues.find((i) => i.field === 'url' || i.code === 'INVALID_INPUT');
  const isEmpty = !(input?.url || '').trim();
  const urlIssue = rawIssue && (rawIssue.code !== 'EMPTY_URL' || !isEmpty) ? rawIssue : undefined;

  return (
    <div class="form-group">
      <label htmlFor="url-input" class="form-label">
        Website URL
      </label>
      <input
        id="url-input"
        type="url"
        class={`form-control ${urlIssue ? 'is-invalid' : ''}`}
        value={input?.url || ''}
        onInput={(e) =>
          updatePayloadInput<UrlPayloadInput>('url', { url: (e.target as HTMLInputElement).value })
        }
        placeholder="https://example.com"
        aria-describedby={urlIssue ? 'url-error' : undefined}
        aria-invalid={Boolean(urlIssue)}
        required
      />
      {urlIssue && (
        <p id="url-error" class="form-error" role="alert">
          {urlIssue.message}
        </p>
      )}
    </div>
  );
}
