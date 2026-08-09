import { QrMetadata as QrMetadataModel } from '../../qr/types';
import { QrRenderResult } from '../../render/types';

interface QrMetadataProps {
  metadata: QrMetadataModel | null;
  renderResult: QrRenderResult | null;
}

export function QrMetadata({ metadata, renderResult }: QrMetadataProps) {
  if (!metadata || !renderResult) {
    return null;
  }

  return (
    <div class="qr-metadata-bar" aria-label="QR Code Specifications">
      <span>Version {metadata.version}</span>
      <span class="metadata-separator" aria-hidden="true">
        •
      </span>
      <span>
        {renderResult.totalModules} × {renderResult.totalModules} modules
      </span>
      <span class="metadata-separator" aria-hidden="true">
        •
      </span>
      <span>ECC {metadata.ecc}</span>
    </div>
  );
}
