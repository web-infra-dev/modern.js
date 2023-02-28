import { expect, describe, it } from 'vitest';
import { createBuilder } from '../helper';
import { builderPluginFallback } from '@/plugins/fallback';
import { BuilderPlugin } from '@/types';

describe('plugins/fallback', () => {
  const testPlugin: BuilderPlugin = {
    name: 'test-plugin',
    setup(api) {
      api.modifyBundlerChain(chain => {
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
    const builder = await createBuilder({
      plugins: [testPlugin, builderPluginFallback()],
      builderConfig: {
        output: {
          enableAssetFallback: true,
        },
      },
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should not convert fallback rule when output.enableAssetFallback is not enabled', async () => {
    const builder = await createBuilder({
      plugins: [testPlugin, builderPluginFallback()],
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});
