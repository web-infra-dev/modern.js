import { describe, expect, it } from '@rstest/core';
import { getRscPlugins } from '../src/plugins/rscConfig';

describe('getRscPlugins', () => {
  const internalDir = '/tmp/internal';

  it('returns no plugins when RSC is disabled', async () => {
    const plugins = await getRscPlugins(false, internalDir);
    expect(plugins).toHaveLength(0);
  });

  it('returns the RSC plugins when enabled (default environments)', async () => {
    const plugins = await getRscPlugins(true, internalDir);
    expect(plugins).toHaveLength(2);
    expect(plugins.map(p => p.name)).toContain('builder:rsc-config');
  });

  it('accepts a custom environments mapping without throwing', async () => {
    const plugins = await getRscPlugins(true, internalDir, {
      server: 'Server',
      client: 'Render',
    });
    expect(plugins).toHaveLength(2);
    expect(plugins.map(p => p.name)).toContain('builder:rsc-config');
  });
});
