import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import {
  copyPngToClipboard,
  copySvgToClipboard,
  downloadBlob,
  exportQrImage,
  exportQrSvg,
  isCopyImageSupported,
  isCopyTextSupported,
  ImageSizePreset,
} from '../../export';
import { PayloadType } from '../../payloads/types';
import { planRasterSize } from '../../render/raster/plan';
import { QrRenderResult } from '../../render/types';

interface ExportPanelProps {
  renderResult: QrRenderResult | null;
  payloadType: PayloadType;
  disabled: boolean;
  metadata?: ComponentChildren;
}

export const IMAGE_SIZE_PRESETS: ImageSizePreset[] = [256, 512, 1024, 2048];

export function ExportPanel({ renderResult, payloadType, disabled, metadata }: ExportPanelProps) {
  const [requestedSize, setRequestedSize] = useState<ImageSizePreset>(1024);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState<boolean>(false);

  const canCopyText = isCopyTextSupported();
  const canCopyImage = isCopyImageSupported();

  useEffect(() => {
    if (disabled) {
      setIsMoreOptionsOpen(false);
    }
  }, [disabled]);

  // Compute actual snapped PNG size for preview display
  const plan = renderResult
    ? planRasterSize(renderResult.totalModules, requestedSize)
    : { pixelsPerModule: 0, actualSizePx: 0 };

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => {
      setFeedback(null);
    }, 3000);
  };

  const handleDownloadSvg = () => {
    if (!renderResult || disabled) return;
    try {
      const { blob, filename } = exportQrSvg(renderResult.svg, payloadType);
      downloadBlob(blob, filename);
      showFeedback('SVG downloaded.');
    } catch {
      showFeedback('Failed to export SVG.');
    }
  };

  const handleDownloadImage = async (format: 'png' | 'jpeg' | 'webp') => {
    if (!renderResult || disabled) return;
    setIsExporting(true);
    try {
      const imgResult = await exportQrImage(renderResult.svg, payloadType, requestedSize, format);
      downloadBlob(imgResult.blob, imgResult.filename);
      showFeedback(`${format.toUpperCase()} downloaded.`);
    } catch {
      showFeedback(`Failed to export ${format.toUpperCase()}.`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopySvg = async () => {
    if (!renderResult || disabled || !canCopyText) return;
    const success = await copySvgToClipboard(renderResult.svg);
    if (success) {
      showFeedback('SVG copied to clipboard.');
    } else {
      showFeedback('Failed to copy SVG to clipboard.');
    }
  };

  const handleCopyPng = async () => {
    if (!renderResult || disabled || !canCopyImage) return;
    setIsExporting(true);
    try {
      const imgResult = await exportQrImage(renderResult.svg, payloadType, requestedSize, 'png');
      const success = await copyPngToClipboard(imgResult.blob);
      if (success) {
        showFeedback('PNG image copied to clipboard.');
      } else {
        showFeedback('Failed to copy image to clipboard.');
      }
    } catch {
      showFeedback('Failed to generate PNG image for copy.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        class="btn btn-primary btn-large export-primary-download"
        disabled={disabled || isExporting}
        onClick={() => handleDownloadImage('png')}
      >
        Download PNG
      </button>

      {metadata}

      <div class="export-secondary-panel">
        <details
          class="export-options-disclosure"
          open={isMoreOptionsOpen}
          aria-disabled={disabled}
          onToggle={(event) => {
            const open = (event.currentTarget as { open: boolean }).open;
            setIsMoreOptionsOpen(open);
          }}
        >
          <summary class="export-summary">More export options</summary>

          <div class="export-panel">
            <h3 class="export-heading">Export</h3>

            <div class="export-size-row">
              <label htmlFor="image-size-select" class="form-label export-size-label">
                Image size
              </label>
              <div class="export-size-controls">
                <select
                  id="image-size-select"
                  class="form-control export-size-select"
                  aria-label="Image Export Size"
                  value={requestedSize}
                  disabled={disabled || isExporting}
                  onChange={(e) =>
                    setRequestedSize(
                      Number((e.target as HTMLSelectElement).value) as ImageSizePreset
                    )
                  }
                >
                  {IMAGE_SIZE_PRESETS.map((preset) => (
                    <option key={preset} value={preset}>
                      {preset} px
                    </option>
                  ))}
                </select>
                {renderResult && plan.actualSizePx > 0 && (
                  <span
                    class="snapped-size-info"
                    title="Integer pixel-per-module snapped dimension"
                  >
                    {plan.actualSizePx} Ã— {plan.actualSizePx} px output
                  </span>
                )}
              </div>
            </div>

            <div
              class="export-primary-actions"
              style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <button
                type="button"
                class="btn btn-secondary export-btn-secondary"
                disabled={disabled || isExporting}
                onClick={handleDownloadSvg}
              >
                Download SVG
              </button>
              <button
                type="button"
                class="btn btn-secondary export-btn-secondary"
                disabled={disabled || isExporting}
                onClick={() => handleDownloadImage('jpeg')}
              >
                Download JPEG
              </button>
              <button
                type="button"
                class="btn btn-secondary export-btn-secondary"
                disabled={disabled || isExporting}
                onClick={() => handleDownloadImage('webp')}
              >
                Download WEBP
              </button>
            </div>

            <div class="export-tertiary-actions">
              <button
                type="button"
                class="btn btn-tertiary"
                disabled={disabled || isExporting || !canCopyImage}
                title={!canCopyImage ? 'Copy image not supported in this browser' : undefined}
                onClick={handleCopyPng}
              >
                Copy PNG
              </button>

              <button
                type="button"
                class="btn btn-tertiary"
                disabled={disabled || isExporting || !canCopyText}
                title={!canCopyText ? 'Copy text not supported in this browser' : undefined}
                onClick={handleCopySvg}
              >
                Copy SVG
              </button>
            </div>

            {feedback && (
              <div class="export-feedback-toast" role="status" aria-live="polite">
                {feedback}
              </div>
            )}
          </div>
        </details>
      </div>
    </>
  );
}
