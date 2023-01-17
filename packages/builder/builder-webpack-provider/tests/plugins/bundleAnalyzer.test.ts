import { expect, describe, it } from 'vitest';
import { builderPluginBundleAnalyzer } from '@/plugins/bundleAnalyzer';
import { createStubBuilder } from '@/stub';

describe('plugins/bundleAnalyze', () => {
  it('should add bundle analyze plugin', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginBundleAnalyzer()],
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
