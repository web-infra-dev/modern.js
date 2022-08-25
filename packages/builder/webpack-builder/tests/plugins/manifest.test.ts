import { expect, describe, it } from 'vitest';
import { PluginManifest } from '../../src/plugins/manifest';
import { createStubBuilder } from '../utils/builder';
import { isPluginRegistered } from '../utils/webpack';

describe('plugins/manifest', () => {
  it('should not register manifest plugin by default', async () => {
    const builder = createStubBuilder({
      plugins: [PluginManifest()],
    });
    const config = await builder.unwrapWebpackConfig();
    expect(isPluginRegistered(config, 'WebpackManifestPlugin')).toBeFalsy();
  });

  it('should register manifest plugin when output.enableAssetManifest is enabled', async () => {
    const builder = createStubBuilder({
      plugins: [PluginManifest()],
      builderConfig: {
        output: {
          enableAssetManifest: true,
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(isPluginRegistered(config, 'WebpackManifestPlugin')).toBeTruthy();
  });
});
