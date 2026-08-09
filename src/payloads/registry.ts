import { calendarSerializer } from './calendar';
import { emailSerializer } from './email';
import { geoSerializer } from './geo';
import { phoneSerializer } from './phone';
import { smsSerializer } from './sms';
import { textSerializer } from './text';
import { PayloadSerializer, PayloadType } from './types';
import { urlSerializer } from './url';
import { vCardSerializer } from './vcard';
import { wifiSerializer } from './wifi';

/**
 * PureQR Payload Serializer Registry
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export const PAYLOAD_REGISTRY: Record<PayloadType, PayloadSerializer<any, any>> = {
  url: urlSerializer,
  text: textSerializer,
  wifi: wifiSerializer,
  email: emailSerializer,
  phone: phoneSerializer,
  sms: smsSerializer,
  vcard: vCardSerializer,
  geo: geoSerializer,
  calendar: calendarSerializer,
};

/**
 * Resolves a PayloadSerializer instance for a given PayloadType.
 * Throws RangeError if the payload type is unknown or unregistered.
 */
export function getPayloadSerializer(type: PayloadType): PayloadSerializer<any, any> {
  const serializer = PAYLOAD_REGISTRY[type];
  if (!serializer) {
    throw new RangeError(`Unregistered or invalid payload type: "${String(type)}"`);
  }
  return serializer;
}
