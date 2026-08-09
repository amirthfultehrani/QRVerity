import { EccLevel } from '../../qr/types';
import { ecc, logoAsset, setEcc } from '../../state/generator';

export interface EccOption {
  level: EccLevel;
  label: string;
  subLabel: string;
}

export const ECC_OPTIONS: EccOption[] = [
  { level: 'L', label: 'L', subLabel: 'Smallest' },
  { level: 'M', label: 'M', subLabel: 'Balanced' },
  { level: 'Q', label: 'Q', subLabel: 'Stronger' },
  { level: 'H', label: 'H', subLabel: 'Strongest' },
];

export function EccSelector() {
  const currentEcc = ecc.value;
  const isForcedForLogo = Boolean(logoAsset.value);
  const effectiveEcc = isForcedForLogo ? 'H' : currentEcc;

  return (
    <div class="ecc-selector-panel">
      <fieldset class="ecc-fieldset" disabled={isForcedForLogo} aria-describedby="ecc-help">
        <legend class="ecc-legend">
          Error correction
          {isForcedForLogo && (
            <span class="ecc-forced-tag" title="Logos automatically require Error Correction H">
              (Forced H for Logo)
            </span>
          )}
        </legend>
        <div class="ecc-grid" role="radiogroup" aria-label="Error Correction Level">
          {ECC_OPTIONS.map((opt) => {
            const isSelected = effectiveEcc === opt.level;
            return (
              <label
                key={opt.level}
                class={`ecc-card ${isSelected ? 'is-selected' : ''} ${isForcedForLogo ? 'is-disabled' : ''}`}
                htmlFor={`ecc-radio-${opt.level}`}
              >
                <input
                  id={`ecc-radio-${opt.level}`}
                  type="radio"
                  name="ecc-level"
                  value={opt.level}
                  checked={isSelected}
                  disabled={isForcedForLogo}
                  aria-label={`${opt.label} — ${opt.subLabel.toLowerCase()}`}
                  onChange={() => setEcc(opt.level)}
                  class="sr-only"
                />
                <span class="ecc-badge">{opt.label}</span>
                <span class="ecc-desc">{opt.subLabel}</span>
              </label>
            );
          })}
        </div>
        {isForcedForLogo && (
          <p class="ecc-forced-note">
            Logos automatically use Error Correction H for maximum data resilience.
          </p>
        )}
      </fieldset>
      <p id="ecc-help" class="ecc-helper">
        More error correction adds recovery data but can make the QR denser.
      </p>
      <details class="ecc-disclosure">
        <summary>What is error correction?</summary>
        <p>
          QR codes can include extra redundant data. If part of the code is damaged, dirty,
          obscured, or difficult to read, a scanner may use that redundancy to recover the encoded
          content.
        </p>
        <p>
          Higher error-correction levels add more redundancy, but can make the QR code larger or
          denser. M is a good general-purpose default. QRVerity automatically uses H when a logo is
          added for additional resilience.
        </p>
      </details>
    </div>
  );
}
