import { PayloadIssue } from '../../../payloads/types';
import { VCardPayloadInput } from '../../../payloads/vcard';
import { updatePayloadInput } from '../../../state/generator';

interface VCardFormProps {
  input: VCardPayloadInput;
  issues: readonly PayloadIssue[];
}

export function VCardForm({ input, issues }: VCardFormProps) {
  const globalIssue = issues.find((i) => i.code === 'MISSING_CONTACT_IDENTIFIER');

  const getIssue = (field: string) => issues.find((i) => i.field === field);

  return (
    <div class="form-stack">
      {globalIssue && (
        <div class="form-banner error-banner" role="alert">
          {globalIssue.message}
        </div>
      )}

      <fieldset class="form-section">
        <legend class="form-section-title">Name</legend>
        <div class="form-grid-2">
          <div class="form-group">
            <label htmlFor="vcard-fn" class="form-label">
              First Name
            </label>
            <input
              id="vcard-fn"
              type="text"
              class={`form-control ${getIssue('firstName') ? 'is-invalid' : ''}`}
              value={input.firstName || ''}
              onInput={(e) =>
                updatePayloadInput<VCardPayloadInput>('vcard', {
                  firstName: (e.target as HTMLInputElement).value,
                })
              }
              placeholder="Jane"
            />
          </div>
          <div class="form-group">
            <label htmlFor="vcard-ln" class="form-label">
              Last Name
            </label>
            <input
              id="vcard-ln"
              type="text"
              class={`form-control ${getIssue('lastName') ? 'is-invalid' : ''}`}
              value={input.lastName || ''}
              onInput={(e) =>
                updatePayloadInput<VCardPayloadInput>('vcard', {
                  lastName: (e.target as HTMLInputElement).value,
                })
              }
              placeholder="Doe"
            />
          </div>
        </div>
      </fieldset>

      <fieldset class="form-section">
        <legend class="form-section-title">Work</legend>
        <div class="form-grid-2">
          <div class="form-group">
            <label htmlFor="vcard-org" class="form-label">
              Organization
            </label>
            <input
              id="vcard-org"
              type="text"
              class={`form-control ${getIssue('organization') ? 'is-invalid' : ''}`}
              value={input.organization || ''}
              onInput={(e) =>
                updatePayloadInput<VCardPayloadInput>('vcard', {
                  organization: (e.target as HTMLInputElement).value,
                })
              }
              placeholder="Acme Corp"
            />
          </div>
          <div class="form-group">
            <label htmlFor="vcard-title" class="form-label">
              Job Title
            </label>
            <input
              id="vcard-title"
              type="text"
              class={`form-control ${getIssue('title') ? 'is-invalid' : ''}`}
              value={input.title || ''}
              onInput={(e) =>
                updatePayloadInput<VCardPayloadInput>('vcard', {
                  title: (e.target as HTMLInputElement).value,
                })
              }
              placeholder="Software Engineer"
            />
          </div>
        </div>
      </fieldset>

      <fieldset class="form-section">
        <legend class="form-section-title">Contact</legend>
        <div class="form-grid-2">
          <div class="form-group">
            <label htmlFor="vcard-phone" class="form-label">
              Phone Number
            </label>
            <input
              id="vcard-phone"
              type="tel"
              class={`form-control ${getIssue('phone') ? 'is-invalid' : ''}`}
              value={input.phone || ''}
              onInput={(e) =>
                updatePayloadInput<VCardPayloadInput>('vcard', {
                  phone: (e.target as HTMLInputElement).value,
                })
              }
              placeholder="+1-555-0199"
            />
          </div>
          <div class="form-group">
            <label htmlFor="vcard-email" class="form-label">
              Email Address
            </label>
            <input
              id="vcard-email"
              type="email"
              class={`form-control ${getIssue('email') ? 'is-invalid' : ''}`}
              value={input.email || ''}
              onInput={(e) =>
                updatePayloadInput<VCardPayloadInput>('vcard', {
                  email: (e.target as HTMLInputElement).value,
                })
              }
              placeholder="jane@example.com"
            />
          </div>
        </div>
        <div class="form-group" style={{ marginTop: '0.75rem' }}>
          <label htmlFor="vcard-website" class="form-label">
            Website URL
          </label>
          <input
            id="vcard-website"
            type="url"
            class={`form-control ${getIssue('website') ? 'is-invalid' : ''}`}
            value={input.website || ''}
            onInput={(e) =>
              updatePayloadInput<VCardPayloadInput>('vcard', {
                website: (e.target as HTMLInputElement).value,
              })
            }
            placeholder="https://example.com"
          />
        </div>
      </fieldset>

      <fieldset class="form-section">
        <legend class="form-section-title">Address (Optional)</legend>
        <div class="form-group">
          <label htmlFor="vcard-street" class="form-label">
            Street Address
          </label>
          <input
            id="vcard-street"
            type="text"
            class={`form-control ${getIssue('street') ? 'is-invalid' : ''}`}
            value={input.street || ''}
            onInput={(e) =>
              updatePayloadInput<VCardPayloadInput>('vcard', {
                street: (e.target as HTMLInputElement).value,
              })
            }
            placeholder="123 Main Street"
          />
        </div>
        <div class="form-grid-2" style={{ marginTop: '0.75rem' }}>
          <div class="form-group">
            <label htmlFor="vcard-city" class="form-label">
              City
            </label>
            <input
              id="vcard-city"
              type="text"
              class={`form-control ${getIssue('city') ? 'is-invalid' : ''}`}
              value={input.city || ''}
              onInput={(e) =>
                updatePayloadInput<VCardPayloadInput>('vcard', {
                  city: (e.target as HTMLInputElement).value,
                })
              }
              placeholder="Metropolis"
            />
          </div>
          <div class="form-group">
            <label htmlFor="vcard-region" class="form-label">
              State / Region
            </label>
            <input
              id="vcard-region"
              type="text"
              class={`form-control ${getIssue('region') ? 'is-invalid' : ''}`}
              value={input.region || ''}
              onInput={(e) =>
                updatePayloadInput<VCardPayloadInput>('vcard', {
                  region: (e.target as HTMLInputElement).value,
                })
              }
              placeholder="NY"
            />
          </div>
        </div>
        <div class="form-grid-2" style={{ marginTop: '0.75rem' }}>
          <div class="form-group">
            <label htmlFor="vcard-postal" class="form-label">
              Postal Code
            </label>
            <input
              id="vcard-postal"
              type="text"
              class={`form-control ${getIssue('postalCode') ? 'is-invalid' : ''}`}
              value={input.postalCode || ''}
              onInput={(e) =>
                updatePayloadInput<VCardPayloadInput>('vcard', {
                  postalCode: (e.target as HTMLInputElement).value,
                })
              }
              placeholder="10001"
            />
          </div>
          <div class="form-group">
            <label htmlFor="vcard-country" class="form-label">
              Country
            </label>
            <input
              id="vcard-country"
              type="text"
              class={`form-control ${getIssue('country') ? 'is-invalid' : ''}`}
              value={input.country || ''}
              onInput={(e) =>
                updatePayloadInput<VCardPayloadInput>('vcard', {
                  country: (e.target as HTMLInputElement).value,
                })
              }
              placeholder="USA"
            />
          </div>
        </div>
      </fieldset>

      <div class="form-group">
        <label htmlFor="vcard-note" class="form-label">
          Notes (Optional)
        </label>
        <textarea
          id="vcard-note"
          class={`form-control ${getIssue('note') ? 'is-invalid' : ''}`}
          rows={3}
          value={input.note || ''}
          onInput={(e) =>
            updatePayloadInput<VCardPayloadInput>('vcard', {
              note: (e.target as HTMLTextAreaElement).value,
            })
          }
          placeholder="Additional contact notes..."
        />
      </div>
    </div>
  );
}
