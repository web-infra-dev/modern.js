import { expect, describe, it } from 'vitest';
import { PluginBundleAnalyzer } from '@/plugins/bundleAnalyzer';
import { createStubBuilder } from '@/stub';

describe('plugins/bundleAnalyze', () => {
  it('should add bundle analyze plugin', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginBundleAnalyzer()],
      builderConfig: {
        performance: {
          bundleAnalyze: {
            reportFilename: 'index$$.html',
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
