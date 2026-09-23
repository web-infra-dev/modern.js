import { describe, expect, it } from '@rstest/core';
import { selectNgrokOrigin } from '../../../../examples/mcp-apps-modern/scripts/select-ngrok-origin.mjs';

describe('ngrok demo endpoint selection', () => {
  it('selects the HTTPS tunnel for the intended local application', () => {
    const tunnels = [
      {
        public_url: 'http://example.ngrok.test',
        config: { addr: 'http://localhost:8080' },
      },
      {
        public_url: 'https://other.ngrok.test',
        config: { addr: 'http://localhost:9000' },
      },
      {
        public_url: 'https://demo.ngrok.test/',
        config: { addr: 'http://localhost:8080' },
      },
    ];
    expect(selectNgrokOrigin({ tunnels }, 8080)).toBe(
      'https://demo.ngrok.test',
    );
  });
  it('rejects missing, ambiguous, or non-local upstreams', () => {
    expect(() => selectNgrokOrigin({ tunnels: [] }, 8080)).toThrow('found 0');
    const tunnel = {
      public_url: 'https://demo.ngrok.test',
      config: { addr: 'http://127.0.0.1:8080' },
    };
    expect(() =>
      selectNgrokOrigin({ tunnels: [tunnel, tunnel] }, 8080),
    ).toThrow('found 2');
    expect(() =>
      selectNgrokOrigin(
        {
          tunnels: [
            { ...tunnel, config: { addr: 'http://internal.example:8080' } },
          ],
        },
        8080,
      ),
    ).toThrow('found 0');
  });
});
