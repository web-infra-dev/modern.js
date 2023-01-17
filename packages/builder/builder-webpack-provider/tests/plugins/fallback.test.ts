import { expect, describe, it } from 'vitest';
import { builderPluginFallback } from '@/plugins/fallback';
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

        chain.module
          .rule('data-uri')
          .resolve.set('fullySpecified', false)
          .end()
          .mimetype('text/javascript')
          .use('data-uri')
          .loader('data-uri');

        chain.module.rule('bar').test(/bar/).use('bar').loader('bar');
      });
    },
  };

  it('should convert fallback rule correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [testPlugin, builderPluginFallback()],
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
      plugins: [testPlugin, builderPluginFallback()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
