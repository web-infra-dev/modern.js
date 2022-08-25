import { expect, describe, it } from 'vitest';
import { PluginCompatModern } from '../../src/plugins/compatModern';
import { PluginFallback } from '../../src/plugins/fallback';
import { PluginManifest } from '../../src/plugins/manifest';
import { PluginModuleScopes } from '../../src/plugins/moduleScopes';
import { PluginMoment } from '../../src/plugins/moment';
import { PluginOutput } from '../../src/plugins/output';
import { PluginResolve } from '../../src/plugins/resolve';
import { createStubBuilder } from '../utils/builder';

describe('plugins/compatModern', () => {
  it('should apply compatible webpack configs correctly', async () => {
    const builder = createStubBuilder({
      plugins: [
        PluginOutput(),
        PluginResolve(),
        PluginMoment(),
        PluginManifest(),
        PluginCompatModern(),
        PluginModuleScopes(),
        PluginFallback(),
      ],
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should apply name and extensions for node target correctly', async () => {
    const builder = createStubBuilder({
      plugins: [PluginCompatModern()],
      target: ['node'],
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config.name).toEqual('server');
    expect(config.resolve?.extensions).toEqual([
      '.node.tsx',
      '.node.ts',
      '.node.jsx',
      '.node.js',
    ]);
  });

  it('should apply name for modern target correctly', async () => {
    const builder = createStubBuilder({
      plugins: [PluginCompatModern()],
      target: ['modern-web'],
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config.name).toEqual('modern');
  });
});
