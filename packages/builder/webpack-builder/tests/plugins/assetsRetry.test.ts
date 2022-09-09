import { expect, describe, it } from 'vitest';
import { PluginAssetsRetry } from '../../src/plugins/assetsRetry';
import { createStubBuilder } from '../utils/builder';

describe('plugins/assetsRetry', () => {
  it('should add assets retry plugin', async () => {
    const builder = createStubBuilder({
      plugins: [PluginAssetsRetry()],
      builderConfig: {
        output: {
          assetsRetry: {},
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
