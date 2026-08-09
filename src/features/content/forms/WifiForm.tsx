import { PayloadIssue } from '../../../payloads/types';
import { WifiPayloadInput } from '../../../payloads/wifi';
import { updatePayloadInput } from '../../../state/generator';

interface WifiFormProps {
  input: WifiPayloadInput;
  issues: readonly PayloadIssue[];
}

export function WifiForm({ input, issues }: WifiFormProps) {
  const ssidIssue = issues.find((i) => i.field === 'ssid');
  const securityIssue = issues.find((i) => i.field === 'security');
  const passwordIssue = issues.find((i) => i.field === 'password');

  const showPassword = input.security === 'WPA' || input.security === 'WEP';

  return (
    <div class="form-stack">
      <div class="form-group">
        <label htmlFor="wifi-ssid" class="form-label">
          Network Name (SSID)
        </label>
        <input
          id="wifi-ssid"
          type="text"
          class={`form-control ${ssidIssue ? 'is-invalid' : ''}`}
          value={input.ssid || ''}
          onInput={(e) =>
            updatePayloadInput<WifiPayloadInput>('wifi', {
              ssid: (e.target as HTMLInputElement).value,
            })
          }
          placeholder="e.g. MyHomeNetwork"
          aria-describedby={ssidIssue ? 'wifi-ssid-error' : undefined}
          aria-invalid={Boolean(ssidIssue)}
          required
        />
        {ssidIssue && (
          <p id="wifi-ssid-error" class="form-error" role="alert">
            {ssidIssue.message}
          </p>
        )}
        {!ssidIssue && <p class="form-hint">Exact name of the Wi-Fi network — case sensitive</p>}
      </div>

      <div class="form-group">
        <label htmlFor="wifi-security" class="form-label">
          Security Type
        </label>
        <select
          id="wifi-security"
          class={`form-control ${securityIssue ? 'is-invalid' : ''}`}
          value={input.security || 'WPA'}
          onChange={(e) =>
            updatePayloadInput<WifiPayloadInput>('wifi', {
              security: (e.target as HTMLSelectElement).value as 'WPA' | 'WEP' | 'nopass',
            })
          }
        >
          <option value="WPA">WPA / WPA2 / WPA3</option>
          <option value="WEP">WEP</option>
          <option value="nopass">None (Unencrypted)</option>
        </select>
        {securityIssue && (
          <p id="wifi-security-error" class="form-error" role="alert">
            {securityIssue.message}
          </p>
        )}
      </div>

      {showPassword && (
        <div class="form-group">
          <label htmlFor="wifi-password" class="form-label">
            Password
          </label>
          <input
            id="wifi-password"
            type="password"
            class={`form-control ${passwordIssue ? 'is-invalid' : ''}`}
            value={input.password || ''}
            onInput={(e) =>
              updatePayloadInput<WifiPayloadInput>('wifi', {
                password: (e.target as HTMLInputElement).value,
              })
            }
            placeholder="Network password"
            aria-describedby={passwordIssue ? 'wifi-password-error' : undefined}
            aria-invalid={Boolean(passwordIssue)}
          />
          {passwordIssue && (
            <p id="wifi-password-error" class="form-error" role="alert">
              {passwordIssue.message}
            </p>
          )}
        </div>
      )}

      <div class="form-checkbox-group">
        <label class="form-checkbox-label">
          <input
            type="checkbox"
            checked={Boolean(input.hidden)}
            onChange={(e) =>
              updatePayloadInput<WifiPayloadInput>('wifi', {
                hidden: (e.target as HTMLInputElement).checked,
              })
            }
          />
          <span>Hidden Network</span>
        </label>
      </div>
    </div>
  );
}
