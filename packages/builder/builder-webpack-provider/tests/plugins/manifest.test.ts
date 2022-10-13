import { expect, describe, it } from 'vitest';
import { PluginManifest } from '../../src/plugins/manifest';
import { createStubBuilder } from '../../src/stub';

describe('plugins/manifest', () => {
  it('should not register manifest plugin by default', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginManifest()],
    });

    expect(
      await builder.matchWebpackPlugin('WebpackManifestPlugin'),
    ).toBeFalsy();
  });

  it('should register manifest plugin when output.enableAssetManifest is enabled', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginManifest()],
      builderConfig: {
        output: {
          enableAssetManifest: true,
        },
      },
    });

    expect(
      await builder.matchWebpackPlugin('WebpackManifestPlugin'),
    ).toBeTruthy();
  });
});
