import { PayloadIssue } from '../../../payloads/types';
import { UrlPayloadInput } from '../../../payloads/url';
import { updatePayloadInput } from '../../../state/generator';
import { currentValidationResult } from '../../../state/generator';

interface UrlFormProps {
  input: UrlPayloadInput;
  issues: readonly PayloadIssue[];
}

export function UrlForm({ input, issues }: UrlFormProps) {
  const rawIssue = issues.find((i) => i.field === 'url' || i.code === 'INVALID_INPUT');
  const isEmpty = !(input?.url || '').trim();
  const urlIssue = rawIssue && (rawIssue.code !== 'EMPTY_URL' || !isEmpty) ? rawIssue : undefined;

  // Show the resolved URL when auto-prefix is applied
  const rawUrl = (input?.url || '').trim();
  const vResult = currentValidationResult.value;
  const resolvedUrl = vResult.valid && vResult.normalized?.url ? vResult.normalized.url : null;
  const wasAutoPrefixed =
    resolvedUrl && rawUrl.length > 0 && !rawUrl.startsWith('http') && resolvedUrl !== rawUrl;

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
        aria-describedby={urlIssue ? 'url-error' : 'url-hint'}
        aria-invalid={Boolean(urlIssue)}
        required
      />
      {urlIssue && (
        <p id="url-error" class="form-error" role="alert">
          {urlIssue.message}
        </p>
      )}
      {wasAutoPrefixed && !urlIssue && (
        <p id="url-resolved" class="form-hint form-hint--success">
          → {resolvedUrl}
        </p>
      )}
      {!urlIssue && !wasAutoPrefixed && (
        <p id="url-hint" class="form-hint">
          You can type just the domain — we'll add https:// for you
        </p>
      )}
    </div>
  );
}
