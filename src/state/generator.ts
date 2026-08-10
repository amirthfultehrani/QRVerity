import { computed, signal } from '@preact/signals';
import { getPayloadSerializer } from '../payloads/registry';
import { PayloadType, PayloadValidationResult } from '../payloads/types';
import { encodeQr } from '../qr/encoder';
import { createStructureMap } from '../qr/structure';
import { EccLevel, QrMatrix, QrMetadata, QrStructureMap } from '../qr/types';
import { renderQrSvg } from '../render/svg';
import { DataModuleStyle, FinderStyle, QrLogoAsset, QrRenderResult } from '../render/types';

export interface GenerationResult {
  readonly canonicalString: string;
  readonly matrix: QrMatrix | null;
  readonly metadata: QrMetadata | null;
  readonly structureMap: QrStructureMap | null;
  readonly renderResult: QrRenderResult | null;
  readonly error: string | null;
  readonly isEccForcedForLogo: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export type PayloadInputsMap = Record<PayloadType, any>;

const defaultPayloadInputs: PayloadInputsMap = {
  url: { url: 'https://example.com' },
  text: { text: '' },
  wifi: { ssid: '', security: 'WPA', password: '', hidden: false },
  email: { to: '', subject: '', body: '' },
  phone: { number: '' },
  sms: { number: '', message: '' },
  vcard: {
    firstName: '',
    lastName: '',
    organization: '',
    title: '',
    phone: '',
    email: '',
    website: '',
    street: '',
    city: '',
    region: '',
    postalCode: '',
    country: '',
    note: '',
  },
  geo: { latitude: '', longitude: '' },
  calendar: { title: '', start: '', end: '', location: '', description: '' },
};

/**
 * User-controlled canonical state signals
 */
export const selectedPayloadType = signal<PayloadType>('url');
export const payloadInputs = signal<PayloadInputsMap>(defaultPayloadInputs);
export const ecc = signal<EccLevel>('M');

/**
 * Appearance State Signals
 */
export const foregroundColor = signal<string>('#000000');
export const backgroundColor = signal<string>('#FFFFFF');
export const dataModuleStyle = signal<DataModuleStyle>('square');
export const finderStyle = signal<FinderStyle>('square');
export const logoAsset = signal<QrLogoAsset | null>(null);
export const requestedLogoScale = signal<number>(0.15);

/**
 * Helper state update functions
 */
export function updatePayloadInput<T>(type: PayloadType, updates: Partial<T>): void {
  payloadInputs.value = {
    ...payloadInputs.value,
    [type]: {
      ...payloadInputs.value[type],
      ...updates,
    },
  };
}

export function setPayloadType(type: PayloadType): void {
  selectedPayloadType.value = type;
}

export function setEcc(newEcc: EccLevel): void {
  ecc.value = newEcc;
}

export function setForegroundColor(color: string): void {
  foregroundColor.value = color;
}

export function setBackgroundColor(color: string): void {
  backgroundColor.value = color;
}

export function setDataModuleStyle(style: DataModuleStyle): void {
  dataModuleStyle.value = style;
}

export function setFinderStyle(style: FinderStyle): void {
  finderStyle.value = style;
}

export function setLogoAsset(logo: QrLogoAsset | null): void {
  logoAsset.value = logo;
}

export function setRequestedLogoScale(scale: number): void {
  requestedLogoScale.value = scale;
}

/**
 * Derived signals (pure memoized computations)
 */
export const currentSerializer = computed(() => getPayloadSerializer(selectedPayloadType.value));

export const currentInput = computed(() => payloadInputs.value[selectedPayloadType.value]);

export const currentValidationResult = computed<PayloadValidationResult<any>>(() => {
  return currentSerializer.value.validate(currentInput.value);
});

export const generationResult = computed<GenerationResult>(() => {
  const vResult = currentValidationResult.value;
  if (!vResult.valid || !vResult.normalized) {
    return {
      canonicalString: '',
      matrix: null,
      metadata: null,
      structureMap: null,
      renderResult: null,
      error: null,
      isEccForcedForLogo: false,
    };
  }

  try {
    const canonicalString = currentSerializer.value.serialize(vResult.normalized);

    // Hard Policy: When a logo is present, ECC is automatically forced to 'H' BEFORE encoding
    const isEccForcedForLogo = Boolean(logoAsset.value);
    const effectiveEcc: EccLevel = isEccForcedForLogo ? 'H' : ecc.value;

    const { matrix, metadata } = encodeQr(canonicalString, { ecc: effectiveEcc });
    const structureMap = createStructureMap(matrix.version);
    const renderResult = renderQrSvg(matrix, structureMap, {
      foreground: foregroundColor.value,
      background: backgroundColor.value,
      quietZoneModules: 4,
      dataModuleStyle: dataModuleStyle.value,
      finderStyle: finderStyle.value,
      logo: logoAsset.value,
      logoScale: requestedLogoScale.value,
    });

    return {
      canonicalString,
      matrix,
      metadata,
      structureMap,
      renderResult,
      error: null,
      isEccForcedForLogo,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'QR Encoding failed';
    let userMessage = message;
    if (
      message.toLowerCase().includes('data length exceeds') ||
      message.toLowerCase().includes('data too long') ||
      message.toLowerCase().includes('exceeds') ||
      message.toLowerCase().includes('segment too long')
    ) {
      userMessage =
        'This content is too large to fit in a standard QR code at the selected error-correction level.';
    }
    return {
      canonicalString: '',
      matrix: null,
      metadata: null,
      structureMap: null,
      renderResult: null,
      error: userMessage,
      isEccForcedForLogo: Boolean(logoAsset.value),
    };
  }
});
