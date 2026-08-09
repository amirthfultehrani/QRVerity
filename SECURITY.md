# Security Policy

## Security Model

PureQR is engineered with client-side security and privacy as core priorities.

- **Client-Side Execution**: All payload validation, QR matrix encoding, canonical SVG rendering, image sanitization, and optical worker verification (`jsQR`) occur entirely inside the user's web browser environment.
- **Strict Content Security Policy**: A restrictive meta Content-Security-Policy header is configured in `index.html` preventing external script execution, arbitrary object loading, and remote style references (`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; object-src 'none'; base-uri 'self'; form-action 'self';`).
- **Input & Scheme Validation**: URL input validation permits `http:` and `https:` schemes only. Dangerous URL schemes (`javascript:`, `data:`, `file:`, `blob:`, `vbscript:`, `ftp:`) are strictly rejected.
- **Sanitized Logo Decoding**: Logo files (PNG, JPEG, WebP) are decoded locally, re-rasterized via Canvas, and exported as clean PNG data URLs, stripping all EXIF, IPTC, and XMP metadata completely. SVG logo inputs are strictly forbidden.
- **Zero Sensitive Data Logging**: Production error handlers avoid logging raw error objects or user payload content to developer consoles.

## Reporting Vulnerabilities

If you discover a security vulnerability or CSP concern in PureQR, please report it by opening a security issue on GitHub. Responsible disclosures will be investigated and addressed promptly.
