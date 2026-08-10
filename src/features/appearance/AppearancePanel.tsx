import { useEffect, useRef, useState } from 'preact/hooks';
import {
  calculateContrastRatio,
  isValidHexColor,
  normalizeHexColor,
  suggestSafeColors,
} from '../../render/colors';
import { sanitizeLogoFile } from '../../render/logo/sanitize';
import { DataModuleStyle, FinderStyle } from '../../render/types';
import {
  backgroundColor,
  dataModuleStyle,
  finderStyle,
  foregroundColor,
  generationResult,
  logoAsset,
  requestedLogoScale,
  setBackgroundColor,
  setDataModuleStyle,
  setFinderStyle,
  setForegroundColor,
  setLogoAsset,
  setRequestedLogoScale,
} from '../../state/generator';

export function AppearancePanel() {
  const fg = foregroundColor.value;
  const bg = backgroundColor.value;
  const dataStyle = dataModuleStyle.value;
  const fStyle = finderStyle.value;
  const logo = logoAsset.value;
  const logoScale = requestedLogoScale.value;
  const genResult = generationResult.value;

  const [logoError, setLogoError] = useState<string | null>(null);
  const [isProcessingLogo, setIsProcessingLogo] = useState<boolean>(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState<boolean>(false);
  const [foregroundDraft, setForegroundDraft] = useState<string>(fg);
  const [backgroundDraft, setBackgroundDraft] = useState<string>(bg);
  const activeLogoJobRef = useRef<number>(0);

  useEffect(() => {
    setForegroundDraft(fg);
  }, [fg]);

  useEffect(() => {
    setBackgroundDraft(bg);
  }, [bg]);

  const handleFgTextInput = (val: string) => {
    setForegroundDraft(val);
    if (isValidHexColor(val)) {
      setForegroundColor(normalizeHexColor(val));
    }
  };

  const handleBgTextInput = (val: string) => {
    setBackgroundDraft(val);
    if (isValidHexColor(val)) {
      setBackgroundColor(normalizeHexColor(val));
    }
  };

  const handleForegroundPickerInput = (val: string) => {
    const normalized = normalizeHexColor(val);
    setForegroundDraft(normalized);
    setForegroundColor(normalized);
  };

  const handleBackgroundPickerInput = (val: string) => {
    const normalized = normalizeHexColor(val);
    setBackgroundDraft(normalized);
    setBackgroundColor(normalized);
  };

  const handleLogoFileSelect = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file) return;

    const jobId = ++activeLogoJobRef.current;
    setLogoError(null);
    setIsProcessingLogo(true);

    try {
      const sanitizedLogo = await sanitizeLogoFile(file);
      if (activeLogoJobRef.current === jobId) {
        setLogoAsset(sanitizedLogo);
      }
    } catch (err: unknown) {
      if (activeLogoJobRef.current === jobId) {
        const msg = err instanceof Error ? err.message : 'Failed to process logo file.';
        setLogoError(msg);
        setLogoAsset(null);
      }
    } finally {
      if (activeLogoJobRef.current === jobId) {
        setIsProcessingLogo(false);
      }
    }
  };

  const handleRemoveLogo = () => {
    activeLogoJobRef.current++;
    setLogoAsset(null);
    setLogoError(null);
    setIsProcessingLogo(false);
  };

  const handleResetAppearance = () => {
    handleForegroundPickerInput('#000000');
    handleBackgroundPickerInput('#FFFFFF');
    setDataModuleStyle('square');
    setFinderStyle('square');
    handleRemoveLogo();
    setRequestedLogoScale(0.15);
  };

  const contrastRatio = calculateContrastRatio(fg, bg);

  const effectiveScalePct = genResult.renderResult
    ? Math.round(genResult.renderResult.effectiveLogoScale * 100)
    : Math.round(logoScale * 100);

  const renderContent = () => (
    <div class="appearance-stack">
      {/* Colors Section */}
      <div class="appearance-section">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
          }}
        >
          <h3 class="appearance-subtitle" style={{ margin: 0 }}>
            Colors
          </h3>
          <button type="button" class="btn btn-secondary btn-sm" onClick={handleResetAppearance}>
            Reset Defaults
          </button>
        </div>
        <div class="color-controls-grid">
          <div class="form-group">
            <label htmlFor="fg-color-picker" class="form-label">
              Foreground
            </label>
            <div class="color-picker-input-group">
              <input
                id="fg-color-picker"
                type="color"
                class="color-picker-swatch"
                value={fg}
                onInput={(e) => handleForegroundPickerInput((e.target as HTMLInputElement).value)}
              />
              <input
                id="fg-color-text"
                type="text"
                class="form-control color-hex-text"
                value={foregroundDraft}
                onInput={(e) => handleFgTextInput((e.target as HTMLInputElement).value)}
                placeholder="#000000"
                aria-label="Foreground Hex Color"
              />
            </div>
          </div>

          <div class="form-group">
            <label htmlFor="bg-color-picker" class="form-label">
              Background
            </label>
            <div class="color-picker-input-group">
              <input
                id="bg-color-picker"
                type="color"
                class="color-picker-swatch"
                value={bg}
                onInput={(e) => handleBackgroundPickerInput((e.target as HTMLInputElement).value)}
              />
              <input
                id="bg-color-text"
                type="text"
                class="form-control color-hex-text"
                value={backgroundDraft}
                onInput={(e) => handleBgTextInput((e.target as HTMLInputElement).value)}
                placeholder="#FFFFFF"
                aria-label="Background Hex Color"
              />
            </div>
          </div>
        </div>
        {contrastRatio < 4.5 && (
          <div
            class="form-error color-contrast-warning"
            role="alert"
            style={{
              marginTop: '0.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.5rem 0.75rem',
              borderRadius: '4px',
              gap: '1rem',
            }}
          >
            <span style={{ fontSize: '0.85rem' }}>
              Low contrast ({contrastRatio.toFixed(1)}:1). QR may be risky.
            </span>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => {
                const safe = suggestSafeColors(fg, bg);
                handleForegroundPickerInput(safe.fg);
                handleBackgroundPickerInput(safe.bg);
              }}
            >
              Auto-Fix
            </button>
          </div>
        )}
      </div>

      {/* Data Module Style */}
      <div class="appearance-section">
        <h3 class="appearance-subtitle">Module style</h3>
        <p id="module-style-help" class="appearance-helper">
          Changes the shape of the QR's data marks.
        </p>
        <div
          class="style-buttons-row"
          role="radiogroup"
          aria-label="Data Module Shape"
          aria-describedby="module-style-help"
        >
          {[
            { style: 'square', label: 'Square' },
            { style: 'rounded', label: 'Rounded' },
            { style: 'dot', label: 'Dots' },
          ].map(({ style, label }) => (
            <label
              key={style}
              class={`btn btn-secondary style-btn ${dataStyle === style ? 'is-active' : ''}`}
              htmlFor={`data-style-${style}`}
            >
              <input
                id={`data-style-${style}`}
                type="radio"
                name="data-module-style"
                value={style}
                checked={dataStyle === style}
                onChange={() => setDataModuleStyle(style as DataModuleStyle)}
                class="sr-only"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <details class="appearance-info-disclosure">
          <summary>About module styles</summary>
          <p>
            QRVerity only applies these styles to data modules. Structural QR patterns stay
            protected.
          </p>
          <ul class="appearance-option-notes">
            <li>
              <strong>Square</strong> — Classic square modules. Most conservative.
            </li>
            <li>
              <strong>Rounded</strong> — Squares with softened corners.
            </li>
            <li>
              <strong>Dots</strong> — Circular data modules for a softer look.
            </li>
          </ul>
        </details>
      </div>

      {/* Finder Pattern Style */}
      <div class="appearance-section">
        <h3 class="appearance-subtitle">Finder style</h3>
        <p id="finder-style-help" class="appearance-helper">
          Changes the three large corner markers scanners use to locate the QR.
        </p>
        <div
          class="style-buttons-row"
          role="radiogroup"
          aria-label="Finder Style"
          aria-describedby="finder-style-help"
        >
          {[
            { style: 'square', label: 'Square' },
            { style: 'rounded', label: 'Rounded' },
          ].map(({ style, label }) => (
            <label
              key={style}
              class={`btn btn-secondary style-btn ${fStyle === style ? 'is-active' : ''}`}
              htmlFor={`finder-style-${style}`}
            >
              <input
                id={`finder-style-${style}`}
                type="radio"
                name="finder-style"
                value={style}
                checked={fStyle === style}
                onChange={() => setFinderStyle(style as FinderStyle)}
                class="sr-only"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <details class="appearance-info-disclosure">
          <summary>About finder style</summary>
          <ul class="appearance-option-notes">
            <li>
              <strong>Square</strong> — Classic square corner markers.
            </li>
            <li>
              <strong>Rounded</strong> — Softens the outer finder corners while preserving their QR
              structure.
            </li>
          </ul>
        </details>
      </div>

      {/* Logo Section */}
      <div class="appearance-section">
        <h3 class="appearance-subtitle">Logo</h3>

        {!logo ? (
          <div class="logo-upload-container">
            <label htmlFor="logo-file-input" class="logo-upload-label">
              <span class="logo-upload-title">Upload logo</span>
              <span class="logo-upload-hint">PNG, JPEG or WebP • Max 5 MB</span>
              <input
                id="logo-file-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="sr-only"
                disabled={isProcessingLogo}
                onChange={handleLogoFileSelect}
              />
            </label>
          </div>
        ) : (
          <div class="logo-active-container">
            <div class="logo-meta-row">
              <span class="logo-filename" title={logo.filename}>
                Logo: {logo.filename}
              </span>
              <button type="button" class="btn btn-secondary btn-sm" onClick={handleRemoveLogo}>
                Remove Logo
              </button>
            </div>

            <div class="form-group">
              <label htmlFor="logo-scale-slider" class="form-label">
                Logo Size: {Math.round(logoScale * 100)}%
                {effectiveScalePct !== Math.round(logoScale * 100) && (
                  <span class="logo-clamped-note"> (Clamped to safe {effectiveScalePct}%)</span>
                )}
              </label>
              <input
                id="logo-scale-slider"
                type="range"
                min="0.05"
                max="0.20"
                step="0.01"
                value={logoScale}
                onInput={(e) =>
                  setRequestedLogoScale(parseFloat((e.target as HTMLInputElement).value))
                }
                class="form-control-range"
              />
            </div>
          </div>
        )}

        {logoError && (
          <p class="form-error logo-error-banner" role="alert">
            {logoError}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div class="appearance-panel app-card">
      <details
        class="appearance-disclosure"
        open={isAppearanceOpen}
        onToggle={(event) => setIsAppearanceOpen((event.currentTarget as { open: boolean }).open)}
      >
        <summary class="appearance-summary section-title">Appearance</summary>
        <div class="appearance-body">{renderContent()}</div>
      </details>
    </div>
  );
}
