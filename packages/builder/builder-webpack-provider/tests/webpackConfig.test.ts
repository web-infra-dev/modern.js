import { expect, describe, it } from 'vitest';
import { PluginBasic } from '@/plugins/basic';
import { createStubBuilder } from '@/stub';

describe('webpackConfig', () => {
  it('should allow tools.webpack to return config', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginBasic()],
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
      plugins: [PluginBasic()],
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
      plugins: [PluginBasic()],
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
      plugins: [PluginBasic()],
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
      plugins: [PluginBasic()],
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

  it('should allow  tools.webpackChain to be an array', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginBasic()],
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
});
