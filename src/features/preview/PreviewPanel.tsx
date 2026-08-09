import {
  currentValidationResult,
  ecc,
  generationResult,
  selectedPayloadType,
} from '../../state/generator';
import { ExportPanel } from '../export/ExportPanel';
import { ReliabilityPanel } from '../reliability/ReliabilityPanel';
import { QrMetadata } from './QrMetadata';
import { QrPreview } from './QrPreview';

export function PreviewPanel() {
  const genResult = generationResult.value;
  const vResult = currentValidationResult.value;
  const payloadType = selectedPayloadType.value;
  const currentEcc = ecc.value;
  const hasInputIssues = !vResult.valid;
  const isExportDisabled = hasInputIssues || !genResult.renderResult || Boolean(genResult.error);
  const isValid = !hasInputIssues && Boolean(genResult.renderResult) && !genResult.error;

  return (
    <section class="preview-panel app-card" aria-labelledby="preview-panel-heading">
      <h2 id="preview-panel-heading" class="section-title">
        QR preview
      </h2>

      <div class="preview-stage">
        <QrPreview
          renderResult={genResult.renderResult}
          error={genResult.error}
          hasInputIssues={hasInputIssues}
        />
      </div>

      <ReliabilityPanel
        renderResult={genResult.renderResult}
        canonicalPayload={genResult.canonicalString}
        ecc={currentEcc}
        metadata={genResult.metadata}
        quietZoneModules={4}
        isValid={isValid}
      />

      <ExportPanel
        renderResult={genResult.renderResult}
        payloadType={payloadType}
        disabled={isExportDisabled}
        metadata={
          <QrMetadata metadata={genResult.metadata} renderResult={genResult.renderResult} />
        }
      />

      <div class="privacy-note">
        <svg
          class="privacy-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span>Generated locally in your browser.</span>
      </div>
    </section>
  );
}
