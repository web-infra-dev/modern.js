import { expect, describe, it } from 'vitest';
import { createStubBuilder } from '../../src/stub';
import { PluginProgress } from '../../src/plugins/progress';

describe('plugins/progress', () => {
  it('should register webpackbar by default', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginProgress()],
    });

    const matched = await builder.matchWebpackPlugin('WebpackBarPlugin');
    expect(matched).toBeTruthy();
    expect(matched?.options.name).toEqual('client');
  });

  it('should not register webpackbar if dev.progressBar is false', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginProgress()],
      builderConfig: {
        dev: {
          progressBar: false,
        },
      },
    });

    const matched = await builder.matchWebpackPlugin('WebpackBarPlugin');
    expect(matched).toBeFalsy();
  });
});
