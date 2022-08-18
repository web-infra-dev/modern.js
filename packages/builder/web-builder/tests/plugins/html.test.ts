import { expect, describe, it } from 'vitest';
import { PluginHtml } from '../../src/plugins/html';
import { PluginEntry } from '../../src/plugins/entry';
import { setPathSerializer } from '../utils/snapshot';
import { createStubBuilder } from '../utils/builder';

describe('plugins/html', () => {
  setPathSerializer();

  it('should register html plugin correctly', async () => {
    const builder = createStubBuilder({
      plugins: [PluginEntry(), PluginHtml()],
      entry: {
        main: './src/main.ts',
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to set favicon by html.favicon option', async () => {
    const builder = createStubBuilder({
      plugins: [PluginEntry(), PluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      builderConfig: {
        html: {
          favicon: './src/favicon.ico',
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should allow to set inject by html.inject option', async () => {
    const builder = createStubBuilder({
      plugins: [PluginEntry(), PluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      builderConfig: {
        html: {
          inject: 'body',
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should enable minify in production', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const builder = createStubBuilder({
      plugins: [PluginEntry(), PluginHtml()],
      entry: {
        main: './src/main.ts',
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should allow to modify plugin options by tools.htmlPlugin', async () => {
    const builder = createStubBuilder({
      plugins: [PluginEntry(), PluginHtml()],
      entry: {
        main: './src/main.ts',
      },
      builderConfig: {
        tools: {
          htmlPlugin(config, utils) {
            expect(utils.entryName).toEqual('main');
            return {
              inject: true,
            };
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });
});
