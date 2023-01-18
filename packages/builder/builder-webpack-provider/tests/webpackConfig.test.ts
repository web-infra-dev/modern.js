import { expect, describe, it } from 'vitest';
import { builderPluginBasic } from '@/plugins/basic';
import { createStubBuilder } from '@/stub';

describe('webpackConfig', () => {
  it('should allow tools.webpack to return config', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginBasic()],
      builderConfig: {
        tools: {
          webpack(config) {
            return {
              ...config,
              devtool: 'eval',
            };
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow tools.webpack to modify config object', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginBasic()],
      builderConfig: {
        tools: {
          webpack(config) {
            config.devtool = 'eval';
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow tools.webpack to be an object', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginBasic()],
      builderConfig: {
        tools: {
          webpack: {
            devtool: 'eval',
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow tools.webpack to be an array', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginBasic()],
      builderConfig: {
        tools: {
          webpack: [
            {
              devtool: 'eval',
            },
            config => {
              config.devtool = 'source-map';
            },
          ],
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow to use tools.webpackChain to modify config', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginBasic()],
      builderConfig: {
        tools: {
          webpackChain(chain) {
            chain.devtool('eval');
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should allow tools.webpackChain to be an array', async () => {
    const builder = await createStubBuilder({
      plugins: [builderPluginBasic()],
      builderConfig: {
        tools: {
          webpackChain: [
            chain => {
              chain.devtool('eval');
            },
            chain => {
              chain.devtool('source-map');
            },
          ],
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should export HtmlWebpackPlugin instance', async () => {
    await createStubBuilder({
      builderConfig: {
        tools: {
          webpack(config, utils) {
            expect(utils.HtmlWebpackPlugin.version).toEqual(5);
          },
        },
      },
    });
  });

  it('should allow to append and prepend plugins', async () => {
    const builder = await createStubBuilder({
      builderConfig: {
        tools: {
          webpack(config, utils) {
            utils.appendPlugins([new utils.webpack.DefinePlugin({ foo: '1' })]);
            utils.prependPlugins([
              new utils.webpack.DefinePlugin({ foo: '2' }),
            ]);
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config.plugins).toMatchSnapshot();
  });

  it('should allow to remove plugins', async () => {
    const builder = await createStubBuilder({
      builderConfig: {
        tools: {
          webpack(config, utils) {
            utils.appendPlugins([new utils.webpack.DefinePlugin({ foo: '1' })]);
            utils.prependPlugins([
              new utils.webpack.DefinePlugin({ foo: '2' }),
            ]);
            utils.removePlugin('DefinePlugin');
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config.plugins).toEqual([]);
  });

  it('should allow to add rules', async () => {
    const newRule = {
      test: /\.foo$/,
      loader: 'foo-loader',
    };

    const builder = await createStubBuilder({
      builderConfig: {
        tools: {
          webpack(config, utils) {
            utils.addRules(newRule);
          },
        },
      },
    });

    const config = await builder.unwrapWebpackConfig();
    expect(config.module?.rules).toEqual([newRule]);
  });
});
