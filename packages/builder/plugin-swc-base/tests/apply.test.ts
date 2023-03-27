import { BuilderPlugin } from '@modern-js/builder-webpack-provider';
import { applyBuilderPluginSwc, Output } from '../src';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';
import { it, expect } from 'vitest';

function createMockBuilderPlugin(): BuilderPlugin {
  return {
    name: 'builder-plugin-mock-for-test',
    setup(api) {
      applyBuilderPluginSwc(api, {
        pluginConfig: {},
        transformLoader: '',
        minify: {
          js: function (
            filename: string,
            code: string,
            config: any,
          ): Promise<Output> {
            throw new Error('Function not implemented.');
          },
          css: function (
            filename: string,
            code: string,
            config: any,
          ): Promise<Output> {
            throw new Error('Function not implemented.');
          },
        },
      });
    },
  };
}

it('should apply swc config correctly', async () => {
  const builder = await createStubBuilder({
    plugins: [createMockBuilderPlugin()],
  });

  const config = await builder.unwrapWebpackConfig();

  expect(config).toMatchSnapshot();
});
