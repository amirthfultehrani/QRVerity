import { AppearancePanel } from '../features/appearance/AppearancePanel';
import { ContentPanel } from '../features/content/ContentPanel';
import { EccSelector } from '../features/encoding/EccSelector';
import { PreviewPanel } from '../features/preview/PreviewPanel';

export function App() {
  return (
    <div class="site-container">
      <header class="site-header">
        <div class="header-brand">
          <h1 class="site-title">QRVerity</h1>
          <p class="site-tagline">Private. Reliable. Open Source.</p>
        </div>
        <div class="header-privacy-badge">
          <svg
            class="privacy-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <span>Generated locally in your browser</span>
        </div>
      </header>

      <main id="main-content" class="generator-layout">
        <div class="layout-controls-column">
          <ContentPanel />
          <EccSelector />
          <AppearancePanel />
        </div>
        <div class="layout-preview-column">
          <PreviewPanel />
        </div>
      </main>

      <footer class="site-footer">
        <p>QRVerity • Open source under the MIT License</p>
      </footer>
    </div>
  );
}
