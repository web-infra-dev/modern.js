import { expect, describe, it } from 'vitest';
import { PluginFallback } from '@/plugins/fallback';
import { BuilderPlugin } from '@/types';
import { createStubBuilder } from '@/stub';

describe('plugins/fallback', () => {
  const testPlugin: BuilderPlugin = {
    name: 'test-plugin',
    setup(api) {
      api.modifyWebpackChain(chain => {
        chain.module
          .rule('mjs')
          .test(/\.m?js/)
          .resolve.set('fullySpecified', false);

        chain.module
          .rule('foo')
          .oneOf('foo')
          .test(/foo/)
          .use('foo')
          .loader('foo');

        chain.module.rule('bar').test(/bar/).use('bar').loader('bar');
      });
    },
  };

  it('should convert fallback rule correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [testPlugin, PluginFallback()],
      builderConfig: {
        output: {
          enableAssetFallback: true,
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should not convert fallback rule when output.enableAssetFallback is not enabled', async () => {
    const builder = await createStubBuilder({
      plugins: [testPlugin, PluginFallback()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
