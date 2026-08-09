import { useEffect, useRef, useState } from 'preact/hooks';
import { QrMetadata as QrMetadataModel } from '../../qr/types';
import { calculateContrastRatio, suggestSafeColors } from '../../render/colors';
import { QrRenderResult } from '../../render/types';
import { setBackgroundColor, setForegroundColor } from '../../state/generator';
import { VerificationClient } from '../../verify/client';
import { VerificationState } from '../../verify/types';
import { EccLevel } from '../../qr/types';
import { ReliabilityBadge } from './ReliabilityBadge';

interface ReliabilityPanelProps {
  renderResult: QrRenderResult | null;
  canonicalPayload: string;
  ecc: EccLevel;
  metadata: QrMetadataModel | null;
  quietZoneModules: number;
  isValid: boolean;
}

export function ReliabilityPanel({
  renderResult,
  canonicalPayload,
  ecc,
  metadata,
  quietZoneModules,
  isValid,
}: ReliabilityPanelProps) {
  const clientRef = useRef<VerificationClient | null>(null);
  const [state, setState] = useState<VerificationState>({
    executionState: 'idle',
    reliability: null,
    errorMessage: null,
  });

  // Initialize verification client once
  useEffect(() => {
    const client = new VerificationClient();
    client.onStateChange((newState) => {
      setState(newState);
    });
    clientRef.current = client;

    return () => {
      client.destroy();
      clientRef.current = null;
    };
  }, []);

  // Trigger or invalidate verification when inputs change
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    if (!isValid || !renderResult || !canonicalPayload) {
      client.invalidate();
      return;
    }

    client.requestVerification(renderResult, canonicalPayload, ecc, quietZoneModules);
  }, [renderResult, canonicalPayload, ecc, quietZoneModules, isValid]);

  return (
    <>
      <div class="reliability-panel" data-verification-state={state.executionState}>
        <h3 class="reliability-heading">Predicted Reliability</h3>

        <div class="reliability-content">{renderReliabilityContent(state, renderResult)}</div>

        {/* Accessible live region: only announces completed transitions */}
        <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {getAriaAnnouncement(state)}
        </div>
      </div>

      <details class="reliability-disclosure">
        <summary class="reliability-summary">What does this mean?</summary>
        {renderReliabilityExplanation(state, renderResult, metadata, ecc)}
      </details>
    </>
  );
}

function renderReliabilityContent(state: VerificationState, renderResult: QrRenderResult | null) {
  const { executionState, reliability, errorMessage } = state;

  if (executionState === 'idle') {
    return <p class="reliability-status-text reliability-muted">Awaiting valid QR input.</p>;
  }

  if (executionState === 'pending') {
    return <p class="reliability-status-text reliability-muted">Checking rendered QR…</p>;
  }

  if (executionState === 'unavailable') {
    return (
      <p class="reliability-status-text reliability-muted">
        {errorMessage || 'Rendered-output verification is unavailable in this browser.'}
      </p>
    );
  }

  if (executionState === 'error') {
    return (
      <p class="reliability-status-text reliability-error">
        {errorMessage || 'An error occurred during verification.'}
      </p>
    );
  }

  if (executionState === 'complete' && reliability) {
    const primaryIssue = reliability.issues[0];
    const contrast = renderResult ? getContrastInfo(renderResult) : null;
    const hasContrastIssue = contrast && contrast.ratio < 4.5;

    return (
      <div class="reliability-result">
        <ReliabilityBadge status={reliability.status} />
        {primaryIssue && <p class="reliability-reason">{primaryIssue.message}</p>}
        {hasContrastIssue && renderResult && (
          <button
            type="button"
            class="btn btn-primary btn-sm"
            style={{ marginTop: '0.75rem', width: '100%' }}
            onClick={() => {
              const safe = suggestSafeColors(renderResult.foreground, renderResult.background);
              setForegroundColor(safe.fg);
              setBackgroundColor(safe.bg);
            }}
          >
            Auto-Fix Colors
          </button>
        )}
      </div>
    );
  }

  return null;
}

function renderReliabilityExplanation(
  state: VerificationState,
  renderResult: QrRenderResult | null,
  metadata: QrMetadataModel | null,
  ecc: EccLevel
) {
  const attempt = state.reliability?.attempts[0];
  const contrast = renderResult ? getContrastInfo(renderResult) : null;

  if (state.executionState !== 'complete' || !state.reliability || !renderResult || !attempt) {
    return (
      <p class="reliability-disclaimer">
        PureQR tests the final rendered QR in your browser once a valid QR is available.
      </p>
    );
  }

  const effectiveEcc = metadata?.ecc ?? ecc;

  return (
    <div class="reliability-explanation">
      <p class="reliability-method">Based on rendered decode, content match, and visual checks.</p>

      <section class="reliability-explanation-section" aria-labelledby="reliability-checks-heading">
        <h4 id="reliability-checks-heading">What PureQR checked</h4>
        <ul class="reliability-fact-list">
          <li>
            <span class="reliability-fact-status">
              {attempt.decodeSucceeded ? 'Passed' : 'Not passed'}
            </span>
            <span>Rendered QR decoded</span>
          </li>
          <li>
            <span class="reliability-fact-status">
              {!attempt.decodeSucceeded
                ? 'Not checked'
                : attempt.payloadMatches
                  ? 'Passed'
                  : 'Not matched'}
            </span>
            <span>Decoded content matched exactly</span>
          </li>
          {contrast && (
            <li>
              <span class="reliability-fact-status">{contrast.label}</span>
              <span>Contrast: {contrast.ratio.toFixed(1)}:1</span>
            </li>
          )}
        </ul>
      </section>

      <section
        class="reliability-explanation-section"
        aria-labelledby="reliability-context-heading"
      >
        <h4 id="reliability-context-heading">Test context</h4>
        <dl class="reliability-context-list">
          <div>
            <dt>Test render:</dt>
            <dd>
              {' '}
              {attempt.actualSizePx} × {attempt.actualSizePx} px
            </dd>
          </div>
          <div>
            <dt>Pixels/module:</dt>
            <dd> {attempt.pixelsPerModule}</dd>
          </div>
          <div>
            <dt>Error correction:</dt>
            <dd> {effectiveEcc}</dd>
          </div>
          <div>
            <dt>Module style:</dt>
            <dd> {formatDataModuleStyle(renderResult.dataModuleStyle)}</dd>
          </div>
          <div>
            <dt>Finder style:</dt>
            <dd> {formatFinderStyle(renderResult.finderStyle)}</dd>
          </div>
          <div>
            <dt>Logo:</dt>
            <dd> {renderResult.hasLogo ? 'Present' : 'None'}</dd>
          </div>
        </dl>
      </section>

      <p class="reliability-explanation-copy">
        PureQR tests the final rendered QR in your browser. Appearance choices such as colors,
        module shapes, finder styling, logos, and QR density can affect whether the rendered code
        decodes successfully.
      </p>
      <p class="reliability-context-note">
        Module style, finder style, logo, and error correction are shown as render context. They
        affect the image that jsQR tests; they are not presented as independent reliability scores.
      </p>
      <p class="reliability-context-note">
        Contrast thresholds are conservative PureQR heuristics, not universal scanner guarantees.
      </p>
      <p class="reliability-disclaimer">
        Real cameras, screens, printers, lighting, distance, and scanning apps can behave
        differently.
      </p>
    </div>
  );
}

function getContrastInfo(renderResult: QrRenderResult): { ratio: number; label: string } | null {
  try {
    const ratio = calculateContrastRatio(renderResult.foreground, renderResult.background);
    return {
      ratio,
      label: ratio >= 4.5 ? 'Strong' : ratio >= 3 ? 'Caution' : 'Low',
    };
  } catch {
    return null;
  }
}

function formatDataModuleStyle(style: QrRenderResult['dataModuleStyle']): string {
  return style === 'dot' ? 'Dots' : style === 'rounded' ? 'Rounded' : 'Square';
}

function formatFinderStyle(style: QrRenderResult['finderStyle']): string {
  return style === 'rounded' ? 'Rounded' : 'Square';
}

function getAriaAnnouncement(state: VerificationState): string {
  if (state.executionState !== 'complete' || !state.reliability) {
    return '';
  }

  const primaryIssue = state.reliability.issues[0];
  const statusLabel =
    state.reliability.status === 'GOOD'
      ? 'Good'
      : state.reliability.status === 'CAUTION'
        ? 'Caution'
        : 'Risky';

  return `Predicted Reliability: ${statusLabel}. ${primaryIssue?.message || ''}`;
}
