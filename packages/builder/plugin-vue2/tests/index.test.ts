import { expect, describe, it } from 'vitest';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';
import { builderPluginBabel } from '@modern-js/builder-webpack-provider/plugins/babel';
import { builderPluginVue2 } from '../src';

describe('plugins/vue', () => {
  it('should add vue-loader and VueLoaderPlugin correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginVue2()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure vueLoader options', async () => {
    const builder = await createStubBuilder({
      plugins: [
        builderPluginVue2({
          vueLoaderOptions: {
            hotReload: false,
          },
        }),
      ],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should apply jsx babel plugin correctly', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginVue2(), builderPluginBabel()],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to configure jsx babel plugin options', async () => {
    const builder = await createStubBuilder({
      plugins: [
        builderPluginVue2({
          vueJsxOptions: {
            injectH: false,
          },
        }),
        builderPluginBabel(),
      ],
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
