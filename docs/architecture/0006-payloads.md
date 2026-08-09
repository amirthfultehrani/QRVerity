# 0006. V1 Payload Serialization & Validation Engine

This document specifies PureQR's payload serialization layer, input validation contracts, escaping specifications, and domain isolation guardrails.

---

## 1. Domain Isolation & Security Principles

> [!IMPORTANT]
> **HARD INVARIANT: Payload modules are pure domain logic.**
> Serializer modules in `src/payloads/` MUST NOT import Preact, DOM/browser APIs, Nayuki vendor code, Canvas, SVG renderers, background workers, or external network libraries. They perform string validation and deterministic formatting strictly in memory.

### Security Rules

- **No Network Execution**: Serializers do not verify domain existence, mailbox validity, or phone line status.
- **No Code Execution**: User input is treated strictly as plain text data. HTML escaping is NOT performed on QR payload text strings because QR readers expect raw plain text, not HTML entities.
- **Strict Scheme Filtering**: URL serializers enforce an explicit whitelist (`http:`, `https:`) and strictly reject dangerous schemes such as `javascript:`, `data:`, `vbscript:`, `file:`, `blob:`, and `ftp:`.

---

## 2. The Nine Locked V1 Payload Types

| Payload Type   | Schema Class                | Canonical Format                                     |
| -------------- | --------------------------- | ---------------------------------------------------- |
| **URL**        | `UrlPayloadSerializer`      | `https://domain.tld/path`                            |
| **Plain Text** | `TextPayloadSerializer`     | `Raw text content`                                   |
| **Wi-Fi**      | `WifiPayloadSerializer`     | `WIFI:T:WPA;S:MyNetwork;P:password;H:false;;`        |
| **Email**      | `EmailPayloadSerializer`    | `mailto:user@domain.tld?subject=S&body=B`            |
| **Phone**      | `PhonePayloadSerializer`    | `tel:+15550199`                                      |
| **SMS**        | `SmsPayloadSerializer`      | `sms:+15550199?body=Message`                         |
| **vCard 3.0**  | `VCardPayloadSerializer`    | `BEGIN:VCARD\r\nVERSION:3.0\r\n...END:VCARD`         |
| **Geo**        | `GeoPayloadSerializer`      | `geo:38.8977,-77.0365`                               |
| **Calendar**   | `CalendarPayloadSerializer` | `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n...END:VCALENDAR` |

---

## 3. Escaping Specifications & Formats

### Wi-Fi Parameter Escaping

Special characters `\`, `;`, `,`, `:`, `"` in SSID and Password fields are escaped with a preceding backslash `\`:

```ts
field.replace(/([\\;,:"])/g, '\\$1');
```

### SMS URI Format (RFC 5724)

PureQR standardizes on the official IETF RFC 5724 SMS URI format `sms:<number>?body=<message>` (or `sms:<number>` when body is omitted). Message bodies are percent-encoded via `encodeURIComponent()`. This format provides maximum cross-platform compatibility across iOS Camera and Android native QR scanners.

### vCard 3.0 Escaping & Line Endings

vCard 3.0 text values escape `\`, `;`, `,`, and newlines (`\n`). Serialized output uses CRLF (`\r\n`) line endings:

```ts
value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
```

### iCalendar 2.0 VEVENT Escaping & Formatting

Calendar events generate iCalendar 2.0 `VEVENT` payloads using UTC ISO date strings (`YYYYMMDDTHHMMSSZ`) and CRLF (`\r\n`) line endings.

- **Exclusions**: Recurrence rules (`RRULE`), attendees, alarms, and custom timezones are excluded from v1 to eliminate ambiguous client timezone bugs.

---

## 4. Validation & Normalization Philosophy

- **Separate Validation & Serialization**: `validate(input)` returns a structured `PayloadValidationResult` containing error/warning issues without throwing exceptions. `serialize(normalized)` receives valid normalized input and deterministically outputs the canonical QR string.
- **Canonical Baseline**: `serialize()` produces the exact canonical string passed to `encodeQr()`. This string serves as the reference baseline for downstream scan verification.
