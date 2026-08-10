import { render, screen } from '@testing-library/preact';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../../../src/app/App';
import {
  generationResult,
  payloadInputs,
  setEcc,
  setPayloadType,
  updatePayloadInput,
} from '../../../src/state/generator';

describe('Phase 4 — Generator State & UI Pipeline Integration', () => {
  beforeEach(() => {
    // Reset state to defaults before each test
    setPayloadType('url');
    setEcc('M');
    payloadInputs.value = {
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
  });

  it('generates valid QR SVG and metadata for default URL state', () => {
    const res = generationResult.value;
    expect(res.renderResult).not.toBeNull();
    expect(res.metadata).not.toBeNull();
    expect(res.canonicalString).toBe('https://example.com/');
    expect(res.renderResult?.svg).toContain('viewBox=');
  });

  it('handles seamless payload switching without state leakage', () => {
    // 1. Switch to Wi-Fi
    setPayloadType('wifi');
    updatePayloadInput('wifi', { ssid: 'OfficeNet', security: 'WPA', password: 'secretpassword' });
    let res = generationResult.value;
    expect(res.canonicalString).toBe('WIFI:T:WPA;S:OfficeNet;P:secretpassword;H:false;;');
    expect(res.renderResult).not.toBeNull();

    // 2. Switch to Text
    setPayloadType('text');
    updatePayloadInput('text', { text: 'Hello QRVerity Text' });
    res = generationResult.value;
    expect(res.canonicalString).toBe('Hello QRVerity Text');
    expect(res.canonicalString).not.toContain('WIFI:');

    // 3. Switch to Geo (Location)
    setPayloadType('geo');
    updatePayloadInput('geo', { latitude: '37.7749', longitude: '-122.4194' });
    res = generationResult.value;
    expect(res.canonicalString).toBe('geo:37.7749,-122.4194');

    // 4. Switch to Calendar
    setPayloadType('calendar');
    updatePayloadInput('calendar', {
      title: 'Team Sync',
      start: new Date(Date.UTC(2026, 7, 8, 15, 0, 0)),
    });
    res = generationResult.value;
    expect(res.canonicalString).toContain('SUMMARY:Team Sync');
    expect(res.canonicalString).toContain('DTSTART:20260808T150000Z');
  });

  it('replaces QR preview with null when form input is invalid', () => {
    setPayloadType('url');
    updatePayloadInput('url', { url: 'javascript:alert(1)' });
    const res = generationResult.value;

    expect(res.renderResult).toBeNull();
    expect(res.canonicalString).toBe('');
  });

  it('renders complete App UI with title, forms, and preview container', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('QRVerity');
    expect(screen.getByText('Generated locally in your browser')).not.toBeNull();
    expect(screen.getByLabelText('Website URL')).not.toBeNull();
    expect(screen.getByLabelText('Generated QR Code Preview')).not.toBeNull();
  });
});
