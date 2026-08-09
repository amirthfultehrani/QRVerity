import { PayloadIssue } from '../../../payloads/types';
import { GeoPayloadInput } from '../../../payloads/geo';
import { updatePayloadInput } from '../../../state/generator';

interface GeoFormProps {
  input: GeoPayloadInput;
  issues: readonly PayloadIssue[];
}

export function GeoForm({ input, issues }: GeoFormProps) {
  const latIssue = issues.find((i) => i.field === 'latitude');
  const lngIssue = issues.find((i) => i.field === 'longitude');

  return (
    <div class="form-grid-2">
      <div class="form-group">
        <label htmlFor="geo-latitude" class="form-label">
          Latitude (-90 to 90)
        </label>
        <input
          id="geo-latitude"
          type="number"
          step="any"
          inputMode="decimal"
          class={`form-control ${latIssue ? 'is-invalid' : ''}`}
          value={
            input.latitude !== undefined && input.latitude !== null ? String(input.latitude) : ''
          }
          onInput={(e) =>
            updatePayloadInput<GeoPayloadInput>('geo', {
              latitude: (e.target as HTMLInputElement).value,
            })
          }
          placeholder="e.g. 37.7749"
          aria-describedby={latIssue ? 'geo-lat-error' : undefined}
          aria-invalid={Boolean(latIssue)}
          required
        />
        {latIssue && (
          <p id="geo-lat-error" class="form-error" role="alert">
            {latIssue.message}
          </p>
        )}
      </div>

      <div class="form-group">
        <label htmlFor="geo-longitude" class="form-label">
          Longitude (-180 to 180)
        </label>
        <input
          id="geo-longitude"
          type="number"
          step="any"
          inputMode="decimal"
          class={`form-control ${lngIssue ? 'is-invalid' : ''}`}
          value={
            input.longitude !== undefined && input.longitude !== null ? String(input.longitude) : ''
          }
          onInput={(e) =>
            updatePayloadInput<GeoPayloadInput>('geo', {
              longitude: (e.target as HTMLInputElement).value,
            })
          }
          placeholder="e.g. -122.4194"
          aria-describedby={lngIssue ? 'geo-lng-error' : undefined}
          aria-invalid={Boolean(lngIssue)}
          required
        />
        {lngIssue && (
          <p id="geo-lng-error" class="form-error" role="alert">
            {lngIssue.message}
          </p>
        )}
      </div>
    </div>
  );
}
