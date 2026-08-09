import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';

describe('App Shell', () => {
  it('renders the title QRVerity and tagline', () => {
    render(<App />);

    const title = screen.getByRole('heading', { level: 1 });
    expect(title.textContent).toBe('QRVerity');

    const tagline = screen.getByText('Private. Reliable. Open Source.');
    expect(tagline).not.toBeNull();
  });
});
