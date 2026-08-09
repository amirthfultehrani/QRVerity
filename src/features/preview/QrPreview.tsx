import { QrRenderResult } from '../../render/types';

interface QrPreviewProps {
  renderResult: QrRenderResult | null;
  error: string | null;
  hasInputIssues: boolean;
}

export function QrPreview({ renderResult, error, hasInputIssues }: QrPreviewProps) {
  if (error) {
    return (
      <div class="qr-preview-placeholder error-state" role="alert">
        <svg
          class="placeholder-icon error-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p class="placeholder-title">Unable to Generate QR</p>
        <p class="placeholder-message">{error}</p>
      </div>
    );
  }

  if (hasInputIssues || !renderResult) {
    return (
      <div class="qr-preview-placeholder" aria-label="QR Code Placeholder">
        <svg
          class="placeholder-icon"
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <rect x="8" y="6" width="32" height="36" rx="4" />
          <path d="M16 18h16M16 25h11M16 32h7" />
        </svg>
        <p class="placeholder-title">Your QR will appear here</p>
        <p class="placeholder-message">Enter content to generate a QR code.</p>
      </div>
    );
  }

  return (
    <div
      class="qr-preview-svg-wrapper"
      role="img"
      aria-label="Generated QR Code Preview"
      dangerouslySetInnerHTML={{ __html: renderResult.svg }}
    />
  );
}
