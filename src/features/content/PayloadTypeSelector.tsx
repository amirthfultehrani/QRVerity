import { PayloadType } from '../../payloads/types';
import { selectedPayloadType, setPayloadType } from '../../state/generator';

export interface PayloadOption {
  type: PayloadType;
  label: string;
}

export const PAYLOAD_OPTIONS: PayloadOption[] = [
  { type: 'url', label: 'Website URL' },
  { type: 'text', label: 'Plain text' },
  { type: 'wifi', label: 'Wi-Fi' },
  { type: 'email', label: 'Email' },
  { type: 'phone', label: 'Phone' },
  { type: 'sms', label: 'SMS' },
  { type: 'vcard', label: 'Contact card' },
  { type: 'geo', label: 'Location' },
  { type: 'calendar', label: 'Calendar event' },
];

export function PayloadTypeSelector() {
  const current = selectedPayloadType.value;

  return (
    <div class="payload-type-selector">
      <label htmlFor="payload-type-select" class="form-label">
        QR type
      </label>

      <select
        id="payload-type-select"
        class="form-control payload-type-select"
        value={current}
        onChange={(e) => setPayloadType((e.target as HTMLSelectElement).value as PayloadType)}
      >
        {PAYLOAD_OPTIONS.map((opt) => (
          <option key={opt.type} value={opt.type}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
